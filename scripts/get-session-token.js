import "dotenv/config";

import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });
dotenv.config({ path: resolve(__dirname, "..", ".env.development"), override: true });
dotenv.config({ path: resolve(__dirname, "..", ".env.local"), override: true });

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

  // 3b. Extract session token — try both secure and non-secure cookie names
  const sessionToken =
    cookieJar.get("__Secure-next-auth.session-token") ??
    cookieJar.get("next-auth.session-token");

  if (!sessionToken) {
    console.error("No session token cookie found. Cookie jar:");
    for (const [k, v] of cookieJar) console.error(`  ${k}=${v.slice(0, 50)}...`);
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
