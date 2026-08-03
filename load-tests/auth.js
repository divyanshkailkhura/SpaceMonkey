import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, getSessionJar, getCredentials } from './lib/utils.js';

const meDuration = new Trend('auth_me');
const statsDuration = new Trend('auth_stats');
const loginDuration = new Trend('auth_login');

export const options = {
  scenarios: {
    auth_ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 5 },
        { duration: '30s', target: 15 },
        { duration: '20s', target: 0 },
      ],
    },
    ...(__ENV.SOAK || __ENV.TEST_LOGIN
      ? {
          auth_login: {
            executor: 'constant-vus',
            vus: __ENV.LOGIN_VUS || 4,
            duration: (__ENV.SOAK ? __ENV.SOAK_DURATION : null) || '1m',
            exec: 'loginFlow',
          },
        }
      : {}),
  },
  thresholds: {
    'auth_me': ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
  },
};

export function loginFlow() {
  const { email, password } = getCredentials();
  if (!email || !password) return;

  const jar = http.cookieJar();
  const start = Date.now();

  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`, { jar });
  check(csrfRes, { 'csrf 200': (r) => r.status === 200 });
  if (csrfRes.status !== 200) return;

  const { csrfToken } = JSON.parse(csrfRes.body);
  const loginRes = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    { email, password, csrfToken, json: 'true', redirect: 'false', callbackUrl: `${BASE_URL}/dashboard` },
    { jar, redirects: 0 }
  );

  loginDuration.add(Date.now() - start);
  check(loginRes, {
    'login 200': (r) => r.status === 200 || r.status === 302,
  });
}

export default function () {
  const jar = getSessionJar();

  group('auth: session validation', function () {
    const res = http.get(`${BASE_URL}/api/users/me`, { jar });
    meDuration.add(res.timings.duration);
    check(res, { 'me 200': (r) => r.status === 200 });
  });

  group('auth: public endpoint', function () {
    const res = http.get(`${BASE_URL}/api/stats`);
    statsDuration.add(res.timings.duration);
    check(res, { 'stats 200': (r) => r.status === 200 });
  });
}
