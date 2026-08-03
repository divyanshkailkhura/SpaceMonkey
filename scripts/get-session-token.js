import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// `quiet: true` keeps dotenv's logging off stdout. This script's stdout is
// captured with `export SESSION_TOKEN=$(node scripts/get-session-token.js)`,
// so ANY extra line corrupts the token (dotenv's "◇ injected env" log contains
// a UTF-8 multibyte ◇ = byte 0xE2, which k6/Go then drops from the cookie,
// silently 401ing every authenticated request). The token (console.log below)
// must be the ONLY line written to stdout.
dotenv.config({ path: resolve(__dirname, "..", ".env"), quiet: true });
dotenv.config({ path: resolve(__dirname, "..", ".env.development"), override: true, quiet: true });
dotenv.config({ path: resolve(__dirname, "..", ".env.local"), override: true, quiet: true });

const BASE_URL = process.env.BASE_URL || "https://spacemonkey.onrender.com";
const FETCH_TIMEOUT = 60_000;

function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function parseCookies(setCookieHeaders) {
  const jar = new Map();
  for (const header of setCookieHeaders) {
    const parts = header.split(";");
    const [name, ...rest] = parts[0].split("=");
    jar.set(name.trim(), rest.join("="));
  }
  return jar;
}

function cookieHeader(jar) {
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function main() {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    console.error("Set TEST_EMAIL and TEST_PASSWORD env vars");
    process.exit(1);
  }

  let cookieJar = new Map();

  // 1. Fetch CSRF token
  console.error("Fetching CSRF token...");
  const csrfRes = await fetchWithTimeout(`${BASE_URL}/api/auth/csrf`, {
    redirect: "manual",
  });
  console.error(`CSRF status: ${csrfRes.status}`);

  const csrfSetCookie = csrfRes.headers.getSetCookie?.() ?? [];
  const merged = parseCookies(csrfSetCookie);
  for (const [k, v] of merged) cookieJar.set(k, v);

  const csrfBody = await csrfRes.json();
  if (!csrfBody.csrfToken) {
    console.error("Failed to get CSRF token:", csrfRes.status, JSON.stringify(csrfBody));
    process.exit(1);
  }

  // 2. Post credentials
  console.error("Posting credentials...");
  const formBody = new URLSearchParams({
    csrfToken: csrfBody.csrfToken,
    email,
    password,
    json: "true",
    redirect: "false",
    callbackUrl: `${BASE_URL}/dashboard`,
  });

  const loginRes = await fetchWithTimeout(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(cookieJar),
    },
    body: formBody.toString(),
    redirect: "manual",
  });

  const loginSetCookie = loginRes.headers.getSetCookie?.() ?? [];
  const loginCookies = parseCookies(loginSetCookie);
  for (const [k, v] of loginCookies) cookieJar.set(k, v);

  if (loginRes.status !== 200) {
    const text = await loginRes.text();
    console.error(`Login failed: status=${loginRes.status}, body=${text.slice(0, 300)}`);
    process.exit(1);
  }

  const loginBody = await loginRes.json();
  if (!loginBody?.url) {
    console.error("Login response missing url:", JSON.stringify(loginBody));
    process.exit(1);
  }

  // 3. Log all set-cookie headers from login response
  console.error("Login Set-Cookie headers:");
  for (const cookie of loginSetCookie) console.error(`  ${cookie.slice(0, 150)}`);
  console.error("Login body url:", loginBody.url);

  // 3b. Extract session token — try both secure and non-secure cookie names.
  // NextAuth splits large JWEs across chunked cookies (name.0, name.1, ...)
  // once the token exceeds ~4KB, so check for chunks before falling back
  // to a single unsuffixed cookie.
  function getPossiblyChunkedCookie(jar, baseName) {
    const chunkKeys = Array.from(jar.keys())
      .filter((k) => k === baseName || k.startsWith(`${baseName}.`))
      .sort((a, b) => {
        const ai = a === baseName ? -1 : parseInt(a.slice(baseName.length + 1), 10);
        const bi = b === baseName ? -1 : parseInt(b.slice(baseName.length + 1), 10);
        return ai - bi;
      });
    if (chunkKeys.length === 0) return null;
    return chunkKeys.map((k) => jar.get(k)).join("");
  }

  const sessionToken =
    getPossiblyChunkedCookie(cookieJar, "__Secure-next-auth.session-token") ??
    getPossiblyChunkedCookie(cookieJar, "next-auth.session-token");

  if (!sessionToken) {
    console.error("No session token cookie found. Cookie jar:");
    for (const [k, v] of cookieJar) console.error(`  ${k}=${v.slice(0, 50)}...`);
    process.exit(1);
  }

  // Hard validation: a real JWT/JWE is pure base64url (A-Z a-z 0-9 - _ .)
  // split into dot-separated segments. Anything outside that set means the
  // token was corrupted somewhere upstream (e.g. a UTF-8 byte sequence
  // getting misread as Latin-1). Fail loudly here instead of silently
  // emitting a broken token that only surfaces as a mysterious 100%
  // auth-failure rate three processes later in a load test.
  if (!/^[A-Za-z0-9\-_.]+$/.test(sessionToken)) {
    const badCharIndex = [...sessionToken].findIndex((c) => !/[A-Za-z0-9\-_.]/.test(c));
    console.error("Session token contains invalid characters — likely corrupted in transit.");
    console.error(`  First bad character at index ${badCharIndex}: ${JSON.stringify(sessionToken[badCharIndex])} (code point ${sessionToken.codePointAt(badCharIndex)})`);
    console.error(`  Token preview: ${JSON.stringify(sessionToken.slice(0, 60))}`);
    process.exit(1);
  }
  console.error(`Got session token: ${sessionToken.slice(0, 20)}...`);

  // 4. Verify the token works by hitting /api/users/me
  console.error("Verifying token...");
  const verifyRes = await fetchWithTimeout(`${BASE_URL}/api/users/me`, {
    headers: {
      Cookie: [
        `__Secure-next-auth.session-token=${sessionToken}`,
        `next-auth.session-token=${sessionToken}`,
      ].join("; "),
    },
  });
  if (verifyRes.status !== 200) {
    console.error(`Session verification failed: ${verifyRes.status}`);
    process.exit(1);
  }
  const user = await verifyRes.json();
  const u = user.data ?? user;
  console.error(`Authenticated as: ${u.name} (${u.email})`);

  // Print just the token to stdout (for capture in env var)
  console.log(sessionToken);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});