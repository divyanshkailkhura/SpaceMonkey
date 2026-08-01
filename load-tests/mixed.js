import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, getSessionJar, sleepBetween } from './lib/utils.js';

const scenarioDuration = new Trend('mixed_scenario');

export const options = {
  scenarios: {
    mixed_smoke: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 10 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    'mixed_scenario': ['p(95)<60000'],
    http_req_duration: ['p(95)<10000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const scenarioStart = Date.now();

  const jar = getSessionJar();

  // 1. Load home/community feed
  group('1: browse posts feed', function () {
    const res = http.get(`${BASE_URL}/api/posts`, { jar });
    check(res, { 'posts 200': (r) => r.status === 200 });
  });
  sleepBetween();

  // 2. Search for communities
  group('2: search communities', function () {
    const res = http.get(`${BASE_URL}/api/communities?search=space`, { jar });
    check(res, { 'communities 200': (r) => r.status === 200 });
  });
  sleepBetween();

  // 3. View a post + vote + comment
  group('3: view post + vote + comment', function () {
    const feedRes = http.get(`${BASE_URL}/api/posts`, { jar });
    if (feedRes.status !== 200) return;

    const { data } = JSON.parse(feedRes.body);
    if (!data || data.length === 0) return;

    const postId = data[0].id;

    const postRes = http.get(`${BASE_URL}/api/posts/${postId}`, { jar });
    check(postRes, { 'post 200': (r) => r.status === 200 });

    let voteRes = http.post(
      `${BASE_URL}/api/posts/${postId}/vote`,
      JSON.stringify({ type: 'UP' }),
      { jar, headers: { 'Content-Type': 'application/json' } }
    );

    if (voteRes.status === 409 || voteRes.status === 404) {
      const freshRes = http.get(`${BASE_URL}/api/posts`, { jar });
      const freshData = JSON.parse(freshRes.body).data;
      if (freshData?.length) {
        voteRes = http.post(
          `${BASE_URL}/api/posts/${freshData[0].id}/vote`,
          JSON.stringify({ type: 'UP' }),
          { jar, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    check(voteRes, { 'vote 200': (r) => r.status === 200 });

    const commentRes = http.post(
      `${BASE_URL}/api/posts/${postId}/comments`,
      JSON.stringify({ content: `Nice post! [${__VU}-${__ITER}]` }),
      { jar, headers: { 'Content-Type': 'application/json' } }
    );
    check(commentRes, { 'comment 201': (r) => r.status === 201 });
  });
  sleepBetween();

  // 4. Search for a specific user to follow (not ourselves)
  group('4: search users + follow', function () {
    const meRes = http.get(`${BASE_URL}/api/users/me`, { jar });
    const myId = meRes.status === 200 ? (JSON.parse(meRes.body).data?.id ?? JSON.parse(meRes.body).id) : null;

    const searchRes = http.get(`${BASE_URL}/api/users/search?q=a`, { jar });
    check(searchRes, { 'search 200': (r) => r.status === 200 });

    const { data } = JSON.parse(searchRes.body);
    const target = data?.find((u) => u.id !== myId);
    if (target) {
      let followRes = http.post(`${BASE_URL}/api/users/${target.id}/follow`, null, { jar });
      if ((followRes.status === 409 || followRes.status === 404) && data.length > 1) {
        const alt = data.find((u) => u.id !== myId && u.id !== target.id);
        if (alt) followRes = http.post(`${BASE_URL}/api/users/${alt.id}/follow`, null, { jar });
      }
      check(followRes, { 'follow 200': (r) => r.status === 200 });
    }
  });
  sleepBetween();

  // 5. Check my profile
  group('5: check profile', function () {
    const res = http.get(`${BASE_URL}/api/users/me`, { jar });
    check(res, { 'me 200': (r) => r.status === 200 });
  });
  sleepBetween();

  // 6. Stats + health
  group('6: stats + health', function () {
    const statsRes = http.get(`${BASE_URL}/api/stats`, { jar });
    check(statsRes, { 'stats 200': (r) => r.status === 200 });

    const healthRes = http.get(`${BASE_URL}/api/health`);
    check(healthRes, { 'health 200': (r) => r.status === 200 });
  });
  sleepBetween();

  // 7. Check events
  group('7: events', function () {
    const res = http.get(`${BASE_URL}/api/events`, { jar });
    check(res, { 'events 200': (r) => r.status === 200 });
  });
  sleepBetween();

  // 8. Favorites + observations
  group('8: favorites + observations', function () {
    const favsRes = http.get(`${BASE_URL}/api/favorites`, { jar });
    check(favsRes, { 'favorites 200': (r) => r.status === 200 });

    const obsRes = http.get(`${BASE_URL}/api/observations`, { jar });
    check(obsRes, { 'observations 200': (r) => r.status === 200 });
  });

  scenarioDuration.add(Date.now() - scenarioStart);
}
