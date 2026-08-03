# SpaceMonkey Load Tests

k6 scripts targeting the production deployment at `https://spacemonkey.onrender.com`.

## Prerequisites

```sh
# Install k6
brew install k6   # macOS
sudo apt install k6   # Linux
# Or: https://k6.io/docs/get-started/installation/
```

## Setup

```sh
# Ensure credentials are set in .env.development
# TEST_EMAIL=...
# TEST_PASSWORD=...

# Install dependencies (needed for session token script)
npm install
```

## Usage

```sh
# 1. Warmup: wake up the Render app (cold starts skew results)
export SESSION_TOKEN=$(node scripts/get-session-token.js)
k6 run --vus 1 --iterations 3 load-tests/mixed.js

# 2. Get a fresh session token
export SESSION_TOKEN=$(node scripts/get-session-token.js)

# 3. Run the full suite
for script in auth posts communities users mixed; do
  echo "=== $script ==="
  k6 run --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" load-tests/$script.js
  echo
done

# 4. Smoke test (1 VU, 1 iteration each)
for script in auth posts communities users mixed; do
  k6 run --vus 1 --iterations 1 load-tests/$script.js
done
```

## Test Suites

| Script | What it tests | Duration | Max VUs |
|--------|--------------|----------|---------|
| `auth.js` | CSRF fetch + login + session validation | 70s | 10 |
| `posts.js` | Post list/search/get + create/vote/comment (N+1 endpoint) | 90s | 30 |
| `communities.js` | Community list/search/create/join + posts by community | 60s | 15 |
| `users.js` | Profile, top, search, follow, followers/following | 90s | 25 |
| `mixed.js` | Realistic user flow: browse → vote → comment → follow → profile → stats | 180s | 20 |

## Interpreting Results

**Key metrics:**
- `http_req_failed` — error rate (should be < 5%)
- Per-endpoint `p(95)` — 95th percentile latency
- Check pass rate — should be > 95%

**Thresholds calibrated for Neon + Render free tier:**
- Reads: p95 < 5s
- Writes: p95 < 8s
- Overall request: p95 < 10s

The `posts.js` suite exercises the known N+1 `attachScore()` bottleneck — expect `posts_list` to show the highest latency.

## Lighthouse (Frontend)

No code changes needed:

```sh
# Install Lighthouse CLI
npm install -g lighthouse

# Run on key pages
lighthouse https://spacemonkey.onrender.com --view --preset=desktop
lighthouse https://spacemonkey.onrender.com/map --view
lighthouse https://spacemonkey.onrender.com/community --view
```

Pay special attention to `/map` — WASM asset size and JavaScript execution time.
