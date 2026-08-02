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

export function getSessionJar() {
  const jar = http.cookieJar();
  const token = validateSessionToken(__ENV.SESSION_TOKEN);

  jar.set(BASE_URL, 'next-auth.session-token', token, { path: '/' });
  jar.set(BASE_URL, '__Secure-next-auth.session-token', token, { path: '/' });

  return jar;
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
