import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, getSessionJar, sleepBetween } from './lib/utils.js';

const meDuration = new Trend('users_me');
const topUsers = new Trend('users_top');
const searchUsers = new Trend('users_search');
const getUser = new Trend('users_get');
const getUserPosts = new Trend('users_posts');
const getUserObservations = new Trend('users_observations');
const getUserCommunities = new Trend('users_communities');
const followUser = new Trend('users_follow');
const followers = new Trend('users_followers');
const following = new Trend('users_following');

export const options = {
  scenarios: {
    users_ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 5 },
        { duration: '30s', target: 15 },
        { duration: '30s', target: 25 },
        { duration: '15s', target: 0 },
      ],
    },
  },
  thresholds: {
    'users_me': ['p(95)<5000'],
    'users_top': ['p(95)<5000'],
    'users_search': ['p(95)<5000'],
    'users_get': ['p(95)<5000'],
    'users_follow': ['p(95)<5000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const jar = getSessionJar();

  group('users: me', function () {
    const res = http.get(`${BASE_URL}/api/users/me`, { jar });
    meDuration.add(res.timings.duration);
    check(res, { 'me 200': (r) => r.status === 200 });
    check(res, { 'me has id': (r) => r.status === 200 && !!(JSON.parse(r.body).data?.id ?? r.json().id) });
  });

  sleepBetween();

  group('users: top', function () {
    const res = http.get(`${BASE_URL}/api/users/top`, { jar });
    topUsers.add(res.timings.duration);
    check(res, { 'top 200': (r) => r.status === 200 });
  });

  sleepBetween();

  group('users: search', function () {
    const res = http.get(`${BASE_URL}/api/users/search?q=test`, { jar });
    searchUsers.add(res.timings.duration);
    check(res, { 'search 200': (r) => r.status === 200 });
  });

  sleepBetween();

  group('users: get profile + posts + observations + communities', function () {
    const meRes = http.get(`${BASE_URL}/api/users/me`, { jar });
    if (meRes.status !== 200) return;
    const userId = JSON.parse(meRes.body).data?.id ?? JSON.parse(meRes.body).id;

    const profileRes = http.get(`${BASE_URL}/api/users/${userId}`, { jar });
    getUser.add(profileRes.timings.duration);
    check(profileRes, { 'profile 200': (r) => r.status === 200 });

    const postsRes = http.get(`${BASE_URL}/api/users/${userId}/posts`, { jar });
    getUserPosts.add(postsRes.timings.duration);
    check(postsRes, { 'posts 200': (r) => r.status === 200 });

    const obsRes = http.get(`${BASE_URL}/api/users/${userId}/observations`, { jar });
    getUserObservations.add(obsRes.timings.duration);
    check(obsRes, { 'observations 200': (r) => r.status === 200 });

    const commRes = http.get(`${BASE_URL}/api/users/${userId}/communities`, { jar });
    getUserCommunities.add(commRes.timings.duration);
    check(commRes, { 'communities 200': (r) => r.status === 200 });

    const followersRes = http.get(`${BASE_URL}/api/users/${userId}/followers`, { jar });
    followers.add(followersRes.timings.duration);
    check(followersRes, { 'followers 200': (r) => r.status === 200 });

    const followingRes = http.get(`${BASE_URL}/api/users/${userId}/following`, { jar });
    following.add(followingRes.timings.duration);
    check(followingRes, { 'following 200': (r) => r.status === 200 });
  });

  sleepBetween();

  group('users: follow toggle', function () {
    const meRes = http.get(`${BASE_URL}/api/users/me`, { jar });
    const myId = meRes.status === 200 ? (JSON.parse(meRes.body).data?.id ?? JSON.parse(meRes.body).id) : null;

    let res;

    for (let attempt = 0; attempt < 2; attempt++) {
      const topRes = http.get(`${BASE_URL}/api/users/top`, { jar });
      if (topRes.status !== 200) return;

      const { data } = JSON.parse(topRes.body);
      const target = data?.find((u) => u.id !== myId);
      if (!target) return;

      res = http.post(`${BASE_URL}/api/users/${target.id}/follow`, null, { jar });
      if (res.status === 200 || res.status === 400) break;
    }

    followUser.add(res.timings.duration);
    check(res, { 'follow 200': (r) => r.status === 200 });
  });

  sleepBetween();
}
