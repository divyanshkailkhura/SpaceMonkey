import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, getSessionJar } from './lib/utils.js';

const meDuration = new Trend('auth_me');
const statsDuration = new Trend('auth_stats');

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
  },
  thresholds: {
    'auth_me': ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
  },
};

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
