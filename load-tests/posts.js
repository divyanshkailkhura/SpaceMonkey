import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, getSessionJar, sleepBetween } from './lib/utils.js';

const listPosts = new Trend('posts_list');
const searchPosts = new Trend('posts_search');
const getPost = new Trend('posts_get');
const createPost = new Trend('posts_create');
const votePost = new Trend('posts_vote');
const commentPost = new Trend('posts_comment');
const followingPosts = new Trend('posts_following');
const deletePost = new Trend('posts_delete');

export const options = {
  scenarios: {
    posts_read: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 5 },
        { duration: '30s', target: 15 },
        { duration: '30s', target: 30 },
        { duration: '15s', target: 0 },
      ],
      exec: 'readPosts',
    },
    posts_write: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 2 },
        { duration: '20s', target: 5 },
        { duration: '10s', target: 0 },
      ],
      exec: 'writePosts',
    },
  },
  thresholds: {
    'posts_list': ['p(95)<5000'],
    'posts_get': ['p(95)<5000'],
    'posts_search': ['p(95)<5000'],
    'posts_create': ['p(95)<8000'],
    'posts_vote': ['p(95)<5000'],
    'posts_comment': ['p(95)<8000'],
    http_req_failed: ['rate<0.05'],
  },
};

export function readPosts() {
  const jar = getSessionJar();

  group('posts: list', function () {
    const res = http.get(`${BASE_URL}/api/posts`, { jar });
    listPosts.add(res.timings.duration);
    check(res, { 'list 200': (r) => r.status === 200 });
  });

  sleepBetween();

  group('posts: list (popular)', function () {
    const res = http.get(`${BASE_URL}/api/posts?sort=popular`, { jar });
    check(res, { 'popular 200': (r) => r.status === 200 });
  });

  sleepBetween();

  group('posts: search', function () {
    const res = http.get(`${BASE_URL}/api/posts?search=star`, { jar });
    searchPosts.add(res.timings.duration);
    check(res, { 'search 200': (r) => r.status === 200 });
  });

  sleepBetween();

  group('posts: following', function () {
    const res = http.get(`${BASE_URL}/api/posts/following`, { jar });
    followingPosts.add(res.timings.duration);
    check(res, { 'following 200': (r) => r.status === 200 });
  });

  sleepBetween();

  group('posts: get single', function () {
    const listRes = http.get(`${BASE_URL}/api/posts`, { jar });
    if (listRes.status !== 200) return;

    const { data } = JSON.parse(listRes.body);
    if (!data || data.length === 0) return;

    const postId = data[0].id;
    const res = http.get(`${BASE_URL}/api/posts/${postId}`, { jar });
    getPost.add(res.timings.duration);
    check(res, { 'get 200': (r) => r.status === 200 });
  });

  sleepBetween();
}

export function writePosts() {
  const jar = getSessionJar();

  group('posts: create', function () {
    const suffix = `${__VU}-${__ITER}`;
    const res = http.post(
      `${BASE_URL}/api/posts`,
      JSON.stringify({
        title: `Benchmark post ${suffix}`,
        content: `This is a load test post from VU ${__VU} iteration ${__ITER}.`,
        category: 'OTHER',
        tags: ['benchmark', 'loadtest'],
      }),
      { jar, headers: { 'Content-Type': 'application/json' } }
    );
    createPost.add(res.timings.duration);
    check(res, { 'create 201': (r) => r.status === 201 });
  });

  sleepBetween();

  group('posts: vote', function () {
    const listRes = http.get(`${BASE_URL}/api/posts`, { jar });
    if (listRes.status !== 200) return;

    const { data } = JSON.parse(listRes.body);
    if (!data || data.length === 0) return;

    const postId = data[0].id;

    let res = http.post(
      `${BASE_URL}/api/posts/${postId}/vote`,
      JSON.stringify({ type: 'UP' }),
      { jar, headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 409 || res.status === 404) {
      const freshRes = http.get(`${BASE_URL}/api/posts`, { jar });
      const freshData = JSON.parse(freshRes.body).data;
      if (freshData?.length) {
        res = http.post(
          `${BASE_URL}/api/posts/${freshData[0].id}/vote`,
          JSON.stringify({ type: 'UP' }),
          { jar, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    votePost.add(res.timings.duration);
    check(res, { 'vote 200': (r) => r.status === 200 });
  });

  sleepBetween();

  group('posts: comment', function () {
    const listRes = http.get(`${BASE_URL}/api/posts`, { jar });
    if (listRes.status !== 200) return;

    const { data } = JSON.parse(listRes.body);
    if (!data || data.length === 0) return;

    const postId = data[0].id;

    const res = http.post(
      `${BASE_URL}/api/posts/${postId}/comments`,
      JSON.stringify({ content: `Benchmark comment ${__VU}-${__ITER}` }),
      { jar, headers: { 'Content-Type': 'application/json' } }
    );
    commentPost.add(res.timings.duration);
    check(res, {
      'comment 201': (r) => r.status === 201,
    });
  });

  sleepBetween();
}

export default readPosts;
