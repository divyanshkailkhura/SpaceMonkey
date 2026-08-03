# SpaceMonkey Load Test Runner Guide

3-way comparison: **Production (Render + Neon)** vs **Scenario A (local app + Neon dev DB)** vs **Scenario B (local app + local PostgreSQL)**.

All scripts use a **multi-user token pool** — each VU gets its own session, each VU targets a different record via `pickIdx()`. No single-row lock contention. `auth.js` includes a real login flow (CSRF + credentials). Content checks assert payload shape, not just status codes.

---

## Prerequisites

- `k6` v2.x, `node` + `npm install`
- PostgreSQL binaries (`initdb`, `postgres`, `psql`, `createdb`) for Scenario B
- Env files: `.env` (prod Neon), `.env.development` (dev Neon)

---

## Build

Build against a local PG with clean migrations. The `.next/` output is DB-agnostic at runtime.

```sh
DATABASE_URL="postgresql://spacemonkey@127.0.0.1:5433/spacemonkey_test" \
  NEXTAUTH_SECRET="dev-secret-loadtest" \
  NEXTAUTH_URL="http://localhost:3000" \
  npm run build
```

---

## One-time setup

### Load-test users

N = 20 users (`loadtest.1..N@spacemonkey.com`, password `LoadTest2026!`) must exist on each DB you test against. Seed once per DB:

```sh
# Prod Neon
SPACE_PG_URL="$(grep '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"')" \
  LOAD_USER_COUNT=20 node scripts/seed-load-users.js

# Dev Neon (Scenario A)
SPACE_PG_URL="$(grep '^DATABASE_URL=' .env.development | cut -d= -f2- | tr -d '"')" \
  LOAD_USER_COUNT=20 node scripts/seed-load-users.js

# Local PG (Scenario B)
SPACE_PG_URL="postgresql://spacemonkey@127.0.0.1:5433/spacemonkey_test" \
  LOAD_USER_COUNT=20 node scripts/seed-load-users.js
```

### Scenario B: local PostgreSQL

```sh
export PGDATA=/tmp/opencode/pgdata
mkdir -p /tmp/opencode /tmp/opencode/pgsock
initdb -D "$PGDATA" -U spacemonkey --auth=trust --encoding=UTF8
echo "port = 5433" >> "$PGDATA/postgresql.conf"
echo "listen_addresses = '127.0.0.1'" >> "$PGDATA/postgresql.conf"
echo "unix_socket_directories = '/tmp/opencode/pgsock'" >> "$PGDATA/postgresql.conf"
echo "max_connections = 2000" >> "$PGDATA/postgresql.conf"
pg_ctl -D "$PGDATA" -l /tmp/opencode/pg.log start

createdb -h 127.0.0.1 -p 5433 -U spacemonkey spacemonkey_test
DATABASE_URL="postgresql://spacemonkey@127.0.0.1:5433/spacemonkey_test" npx prisma migrate deploy
psql -h 127.0.0.1 -p 5433 -U spacemonkey -d spacemonkey_test \
  -v ON_ERROR_STOP=1 -f data-seed/spacemonkey_full.sql
```

---

## Running a scenario

All three share the same runner loop. The difference is the env vars passed to the app and the output file suffix.

### Helper: build the user + token pool

```sh
build_pool() {
  local SUFFIX="$1"
  node -e "const u=[];for(let i=1;i<=20;i++)u.push({email:'loadtest.'+i+'@spacemonkey.com',password:'LoadTest2026!'});console.log(JSON.stringify(u));" > "/tmp/user_pool_${SUFFIX}.json"
  export TOKEN_POOL="$(USER_POOL="$(cat /tmp/user_pool_${SUFFIX}.json)" node scripts/get-token-pool.js)"
  export USER_POOL="$(cat /tmp/user_pool_${SUFFIX}.json)"
}

run_suite() {
  local SUFFIX="$1"
  for script in auth posts communities users mixed; do
    echo "=== $script ==="
    k6 run \
      --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" \
      --summary-export="load-tests/results/${script}-${SUFFIX}.json" \
      "load-tests/${script}.js"
  done
}
```

### Prod — Render + Neon prod DB

```sh
export BASE_URL=https://spacemonkey.onrender.com

# Warmup (wakes Render) — needs a single token; pool isn't built yet
export SESSION_TOKEN=$(BASE_URL=$BASE_URL node scripts/get-session-token.js)
k6 run --vus 1 --iterations 3 load-tests/mixed.js

# Now build the multi-user token pool and run the suite
build_pool prod
export TEST_LOGIN=1
run_suite prod
```

### Scenario A — local app + Neon dev DB

```sh
kill $(lsof -ti :3000) 2>/dev/null
DATABASE_URL="$(grep '^DATABASE_URL=' .env.development | cut -d= -f2- | tr -d '"')" \
  NEXTAUTH_SECRET="$(grep '^NEXTAUTH_SECRET=' .env.development | cut -d= -f2- | tr -d '"')" \
  NEXTAUTH_URL="http://localhost:3000" \
  npm run start &
# wait for "Ready" in the log

export BASE_URL=http://localhost:3000
build_pool scenario-a
export TEST_LOGIN=1
run_suite scenario-a

kill $(lsof -ti :3000) 2>/dev/null
```

### Scenario B — local app + local PostgreSQL

```sh
kill $(lsof -ti :3000) 2>/dev/null
DATABASE_URL="postgresql://spacemonkey@127.0.0.1:5433/spacemonkey_test" \
  NEXTAUTH_SECRET="dev-secret-loadtest" \
  NEXTAUTH_URL="http://localhost:3000" \
  npm run start &
# wait for Ready

export BASE_URL=http://localhost:3000
build_pool scenario-b
export TEST_LOGIN=1
run_suite scenario-b

kill $(lsof -ti :3000) 2>/dev/null
```

> **Token pool lifetime:** session JWEs are encrypted with `NEXTAUTH_SECRET`. If you
> restart the app with a different secret, re-run `build_pool` — the old
> `load-tests/results/token-pool.json` is tied to the secret it was generated with.

---

## Soak / connection-pool check

Add `SOAK=1` (optionally `SOAK_DURATION`, `SOAK_VUS`) for a steady constant-VU stage
that holds peak load:

```sh
SOAK=1 SOAK_DURATION=90s k6 run load-tests/posts.js
```

Watch the app log for `P2037 Too many database connections` under load.

---

## Comparing results

```sh
node scripts/compare-results.js
```

Reads `load-tests/results/posts-{prod,scenario-a,scenario-b}.json` and prints a
side-by-side p95 table.

---

## Thresholds (unchanged)

From `load-tests/posts.js`:

```
posts_list     : p(95) < 5000ms
posts_get      : p(95) < 5000ms
posts_search   : p(95) < 5000ms
posts_create   : p(95) < 8000ms
posts_vote     : p(95) < 5000ms
posts_comment  : p(95) < 8000ms
http_req_failed: rate < 0.05
```

---

## Important gotchas

1. **Build against local DB.** `npm run build` runs `prisma migrate deploy`. Neon DBs loaded
   from raw SQL lack Prisma migration tracking — `migrate deploy` fails. Build against a
   fresh local DB; the `.next/` output works against any DB at runtime.
2. **Singleton pool.** `lib/db.ts` must cache a singleton Prisma client. Per-request pools
   exhaust any connection limit and produce `P2037`.
3. **Local PG SSL.** `lib/db.ts` skips SSL for `localhost`/`127.0.0.1`. If using a remote
   host for Scenario B, SSL will be enabled — keep `DATABASE_URL` pointing at localhost.
4. **NEXTAUTH_SECRET must match.** Session JWEs are encrypted. The `NEXTAUTH_SECRET` used
   when running the app must match the one used when generating the token pool.
5. **Prod write endpoints** in the original baseline looked fast because they failed quickly
   (0% check success). An endpoint that fails fast isn't fast.
