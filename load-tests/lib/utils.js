import http from 'k6/http';
import { check, sleep } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'https://spacemonkey.onrender.com';

export function getSessionJar() {
  const jar = http.cookieJar();
  const token = __ENV.SESSION_TOKEN;

  if (!token) {
    throw new Error('SESSION_TOKEN env var is required. Run: export SESSION_TOKEN=$(node scripts/get-session-token.js)');
  }

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
