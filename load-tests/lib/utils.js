import http from 'k6/http';
import { check, sleep } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'https://spacemonkey.onrender.com';

const BASE64URL = /^[A-Za-z0-9\-_.]+$/;
const TOKEN_EXTRACT = /[A-Za-z0-9\-_.]{40,}/;

// A valid NextAuth JWT is pure base64url (A-Z a-z 0-9 - _ .). Anything else
// means the token was corrupted while being captured or transported (e.g. a
// stray non-ASCII byte). k6 sends the cookie value verbatim, and Go's net/http
// silently drops invalid bytes when serializing the Cookie header — corrupting
// the JWT and making every authenticated request return 401. Fail loudly here
// and point at the source instead of surfacing as a mysterious 100% failure.
export function validateSessionToken(token) {
  if (!token) {
    throw new Error('SESSION_TOKEN env var is required. Run: export SESSION_TOKEN=$(node scripts/get-session-token.js)');
  }
  if (BASE64URL.test(token)) return token;

  // Defense in depth: a capture tool (e.g. get-session-token.js before its
  // dotenv logs were silenced) may have prepended log lines to the real token.
  // Try to extract the embedded base64url token rather than failing outright.
  const extracted = token.match(TOKEN_EXTRACT)?.[0];
  if (extracted && BASE64URL.test(extracted)) {
    console.warn(`WARNING: SESSION_TOKEN contained non-token text; used extracted ${extracted.slice(0, 20)}...`);
    return extracted;
  }

  const badIndex = [...token].findIndex((c) => !BASE64URL.test(c));
  const char = token[badIndex];
  throw new Error(
    `SESSION_TOKEN is not a valid session token (no embedded base64url token found).\n` +
    `  First bad character: ${JSON.stringify(char)} (code point ${char?.codePointAt(0) ?? "n/a"})\n` +
    `  Token preview: ${JSON.stringify(token.slice(0, 60))}\n` +
    `  Diagnose the source: node scripts/inspect-token.js <<< "$SESSION_TOKEN"`
  );
}

// Token pool: each VU gets its own token so the load simulates N independent
// users instead of N connections all acting as one account. Set TOKEN_POOL to
// a JSON array of session tokens (one per user). To scatter by VU deterministically.
const TOKEN_POOL_CACHE = __ENV.TOKEN_POOL ? JSON.parse(__ENV.TOKEN_POOL) : null;
const USER_POOL_CACHE = __ENV.USER_POOL ? JSON.parse(__ENV.USER_POOL) : null;

export function poolSize() {
  return TOKEN_POOL_CACHE ? TOKEN_POOL_CACHE.length : 0;
}

// Resolve the token for the current VU. Falls back to the single SESSION_TOKEN.
export function getSessionToken() {
  if (TOKEN_POOL_CACHE && TOKEN_POOL_CACHE.length > 0) {
    return TOKEN_POOL_CACHE[__VU % TOKEN_POOL_CACHE.length];
  }
  return validateSessionToken(__ENV.SESSION_TOKEN);
}

// Resolve credentials for the current VU from USER_POOL (JSON of {email,password}).
// Falls back to TEST_EMAIL/TEST_PASSWORD.
export function getCredentials() {
  if (USER_POOL_CACHE && USER_POOL_CACHE.length > 0) {
    return USER_POOL_CACHE[__VU % USER_POOL_CACHE.length];
  }
  return { email: __ENV.TEST_EMAIL, password: __ENV.TEST_PASSWORD };
}

export function getSessionJar() {
  const jar = http.cookieJar();
  const token = getSessionToken();

  jar.set(BASE_URL, 'next-auth.session-token', token, { path: '/' });
  jar.set(BASE_URL, '__Secure-next-auth.session-token', token, { path: '/' });

  return jar;
}

// De-hot-spot: pick a stable, scattered index across a list so all VUs don't
// hammer data[0]. Each VU deterministically targets a different record.
export function pickIdx(list) {
  return __VU % list.length;
}

export function login(email, password) {
  const jar = http.cookieJar();

  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`, { jar });
  if (csrfRes.status !== 200) {
    throw new Error('Failed to fetch CSRF token');
  }
  const { csrfToken } = JSON.parse(csrfRes.body);

  const loginRes = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    { email, password, csrfToken, json: 'true', redirect: 'false', callbackUrl: `${BASE_URL}/dashboard` },
    { jar, redirects: 0 }
  );

  check(loginRes, {
    'login succeeded': (r) => r.status === 200 || r.status === 302,
  });

  return jar;
}

export function randomSuffix() {
  return `${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sleepBetween(min, max) {
  sleep((min ?? 0.3) + Math.random() * ((max ?? 1) - (min ?? 0.3)));
}
