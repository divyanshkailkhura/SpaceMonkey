import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env"), quiet: true });
dotenv.config({ path: resolve(__dirname, "..", ".env.development"), override: true, quiet: true });
dotenv.config({ path: resolve(__dirname, "..", ".env.local"), override: true, quiet: true });

const BASE_URL = process.env.BASE_URL || "https://spacemonkey.onrender.com";
const FETCH_TIMEOUT = 60_000;
const OUT = process.env.TOKEN_OUT || resolve(__dirname, "..", "load-tests", "results", "token-pool.json");

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
  return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}
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

async function login(email, password) {
  let cookieJar = new Map();
  const csrfRes = await fetchWithTimeout(`${BASE_URL}/api/auth/csrf`, { redirect: "manual" });
  const csrfSetCookie = csrfRes.headers.getSetCookie?.() ?? [];
  for (const [k, v] of parseCookies(csrfSetCookie)) cookieJar.set(k, v);
  const csrfBody = await csrfRes.json();
  if (!csrfBody.csrfToken) throw new Error(`csrf failed ${csrfRes.status}`);

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
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookieHeader(cookieJar) },
    body: formBody.toString(),
    redirect: "manual",
  });
  const loginCookies = parseCookies(loginRes.headers.getSetCookie?.() ?? []);
  for (const [k, v] of loginCookies) cookieJar.set(k, v);
  if (loginRes.status !== 200) throw new Error(`login ${loginRes.status}`);

  const token =
    getPossiblyChunkedCookie(cookieJar, "__Secure-next-auth.session-token") ??
    getPossiblyChunkedCookie(cookieJar, "next-auth.session-token");
  if (!token) throw new Error("no session token");
  if (!/^[A-Za-z0-9\-_.]+$/.test(token)) throw new Error("corrupt token");
  return token;
}

async function main() {
  const userPool = process.env.USER_POOL ? JSON.parse(process.env.USER_POOL) : null;
  if (!userPool || userPool.length === 0) {
    console.error("Set USER_POOL to a JSON array of {email,password} (see scripts/seed-load-users.js).");
    process.exit(1);
  }

  console.error(`Logging in ${userPool.length} users against ${BASE_URL}...`);
  const tokens = [];
  for (const u of userPool) {
    try {
      const t = await login(u.email, u.password);
      tokens.push(t);
    } catch (e) {
      console.error(`  FAILED ${u.email}: ${e.message}`);
    }
  }
  if (tokens.length === 0) {
    console.error("No tokens obtained — aborting.");
    process.exit(1);
  }
  writeFileSync(OUT, JSON.stringify(tokens, null, 2));
  console.error(`Wrote ${tokens.length} tokens to ${OUT}`);
  console.log(JSON.stringify(tokens));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
