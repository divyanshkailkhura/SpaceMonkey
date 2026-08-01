import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, getSessionJar, randomSuffix, sleepBetween } from './lib/utils.js';

const listCommunities = new Trend('communities_list');
const searchCommunities = new Trend('communities_search');
const getCommunity = new Trend('communities_get');
const createCommunity = new Trend('communities_create');
const joinCommunity = new Trend('communities_join');
const communityPosts = new Trend('communities_posts');

export const options = {
  scenarios: {
    communities_read: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 5 },
        { duration: '30s', target: 15 },
        { duration: '15s', target: 0 },
      ],
      exec: 'readCommunities',
    },
    communities_write: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 2 },
        { duration: '20s', target: 5 },
        { duration: '10s', target: 0 },
      ],
      exec: 'writeCommunities',
    },
  },
  thresholds: {
    'communities_list': ['p(95)<5000'],
    'communities_search': ['p(95)<5000'],
    'communities_get': ['p(95)<5000'],
    'communities_create': ['p(95)<8000'],
    'communities_join': ['p(95)<5000'],
    http_req_failed: ['rate<0.05'],
  },
};

export function readCommunities() {
  const jar = getSessionJar();

  group('communities: list', function () {
    const res = http.get(`${BASE_URL}/api/communities`, { jar });
    listCommunities.add(res.timings.duration);
    check(res, { 'list 200': (r) => r.status === 200 });
  });

  sleepBetween();

  group('communities: search', function () {
    const res = http.get(`${BASE_URL}/api/communities?search=astro`, { jar });
    searchCommunities.add(res.timings.duration);
    check(res, { 'search 200': (r) => r.status === 200 });
  });

  sleepBetween();

  group('communities: get by slug + posts', function () {
    const listRes = http.get(`${BASE_URL}/api/communities`, { jar });
    if (listRes.status !== 200) return;

    const { data } = JSON.parse(listRes.body);
    if (!data || data.length === 0) return;

    const slug = data[0].slug;

    const detailRes = http.get(`${BASE_URL}/api/communities/${slug}`, { jar });
    getCommunity.add(detailRes.timings.duration);
    check(detailRes, { 'detail 200': (r) => r.status === 200 });

    const postsRes = http.get(`${BASE_URL}/api/posts?communityId=${slug}`, { jar });
    communityPosts.add(postsRes.timings.duration);
    check(postsRes, { 'community posts 200': (r) => r.status === 200 });
  });

  sleepBetween();
}

export function writeCommunities() {
  const jar = getSessionJar();

  group('communities: create', function () {
    const suffix = randomSuffix();
    const res = http.post(
      `${BASE_URL}/api/communities`,
      JSON.stringify({
        displayName: `Bench ${suffix}`,
        description: 'Load test community',
      }),
      { jar, headers: { 'Content-Type': 'application/json' } }
    );
    createCommunity.add(res.timings.duration);
    check(res, {
      'create 201/409': (r) => r.status === 201 || r.status === 409,
    });
  });

  sleepBetween();

  group('communities: join/leave toggle', function () {
    const listRes = http.get(`${BASE_URL}/api/communities`, { jar });
    if (listRes.status !== 200) return;

    const { data } = JSON.parse(listRes.body);
    if (!data || data.length === 0) return;

    const slug = data[0].slug;

    const res = http.post(`${BASE_URL}/api/communities/${slug}/join`, null, { jar });
    joinCommunity.add(res.timings.duration);
    check(res, {
      'join 200': (r) => r.status === 200,
    });
  });

  sleepBetween();
}

export default readCommunities;
