# SpaceMonkey Load Test Runner Guide

This guide explains how to reproduce the 3-way load-test comparison:
**Production (Render + Neon)** vs **Scenario A (local app + Neon dev DB)** vs **Scenario B (local app + local PostgreSQL)**.

It runs `load-tests/posts.js` (the worst-degrading endpoint) with **unchanged thresholds** — raw numbers are reported even if they fail.

---

## Prerequisites

- `k6` (v2.x) — https://k6.io/docs/get-started/installation/
- `node` + `npm install` (needed for `scripts/get-session-token.js`)
- PostgreSQL binaries (`initdb`, `postgres`, `psql`, `createdb`) for Scenario B
- Env files:
  - `.env` — production Neon `DATABASE_URL` + `NEXTAUTH_SECRET`
  - `.env.development` — dev Neon `DATABASE_URL` (used by Scenario A; contains the seeded dataset + Aishwarya)

### Test user

Use **Aishwarya** for local scenarios:

```
email:    aishwarya.chakraborty@spacemonkey.com
password: AtomQuest2026!
```

She is registered on the dev Neon DB and is added to the local DB in Scenario B setup.

### Key files

| File | Purpose |
|------|---------|
| `load-tests/posts.js` | k6 posts test (read + write scenarios, thresholds) |
| `load-tests/lib/utils.js` | Shared lib — `BASE_URL` is read from `__ENV.BASE_URL` (falls back to the Render URL) |
| `scripts/get-session-token.js` | Login flow that prints a session token (works against Render; see local note below) |
| `scripts/compare-results.js` | Reads the 3 JSON result files and prints the comparison table |
| `load-tests/results/` | Where `--summary-export` JSON files are stored |
| `data-seed/spacemonkey_full.sql` | Full seeded dataset (used for local PG in Scenario B) |

---

## Build once

The compiled `.next/` output is DB-agnostic at runtime; `DATABASE_URL` only matters at runtime.

```sh
# Scenario B local DB (needs to exist first — see Scenario B setup below, then):
DATABASE_URL="postgresql://spacemonkey@127.0.0.1:5433/spacemonkey_test" \
  NEXTAUTH_SECRET="<any-secret>" \
  NEXTAUTH_URL="http://localhost:3000" \
  npm run build
```

> Note: `npm run build` runs `prisma migrate deploy` first. If you build against the **dev/prod Neon** DB (which was loaded from raw SQL and has no Prisma migration tracking), `migrate deploy` will try to re-apply migrations and fail. Always build against a fresh local DB where migrations apply cleanly.

> Note: `tsconfig.json` uses `"ignoreDeprecations": "5.0"`. If you see `Invalid value for '--ignoreDeprecations'`, set it to `"5.0"` (a value your TypeScript version accepts).

---

## Token generation

### Against Render (production)

```sh
BASE_URL=https://spacemonkey.onrender.com node scripts/get-session-token.js
# uses TEST_EMAIL / TEST_PASSWORD from .env
```

### Against local app (localhost)

The node script has a cookie quirk against local NextAuth (`CredentialsSignin` 401). Use a curl-based login instead:

```sh
rm -f /tmp/sm.jar
CSRF=$(curl -s -c /tmp/sm.jar http://localhost:3000/api/auth/csrf \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['csrfToken'])")
curl -s -b /tmp/sm.jar -c /tmp/sm.jar -X POST \
  http://localhost:3000/api/auth/callback/credentials \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "email=aishwarya.chakraborty@spacemonkey.com" \
  --data-urlencode "password=AtomQuest2026!" \
  --data-urlencode "json=true" \
  --data-urlencode "redirect=false" \
  --data-urlencode "callbackUrl=http://localhost:3000/dashboard" \
  -o /dev/null -w "login HTTP:%{http_code}\n"
export SESSION_TOKEN=$(grep "next-auth.session-token" /tmp/sm.jar | awk '{print $7}')
# Validate the token is pure base64url — a corrupted token silently 401s every
# authenticated request (k6/Go drops the offending byte and sends a broken JWT).
# If this fails, the captured token has a stray non-ASCII byte; inspect it:
#   node scripts/inspect-token.js <<< "$SESSION_TOKEN"
[[ "$SESSION_TOKEN" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "ERROR: captured SESSION_TOKEN is corrupted (non base64url)" >&2; exit 1; }
# verify
curl -s -H "Cookie: next-auth.session-token=$SESSION_TOKEN" http://localhost:3000/api/users/me
```

You can save this as a shell snippet/function in your `~/.zshrc` to reuse.

---

## Running the tests

### 1. Production baseline

```sh
export BASE_URL=https://spacemonkey.onrender.com
export SESSION_TOKEN=$(BASE_URL=$BASE_URL node scripts/get-session-token.js)

# Warmup (wakes Render, avoids cold-start skew)
k6 run --vus 1 --iterations 3 load-tests/mixed.js

# Fresh token after warmup
export SESSION_TOKEN=$(BASE_URL=$BASE_URL node scripts/get-session-token.js)

# Run with full trend stats + JSON export
k6 run \
  --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" \
  --summary-export=load-tests/results/posts-prod.json \
  load-tests/posts.js
```

### 2. Scenario A — local app + dev Neon DB

```sh
# Start the app pointing at the dev Neon DB (has the seeded data + Aishwarya)
DATABASE_URL="$(grep '^DATABASE_URL=' .env.development | cut -d= -f2- | tr -d '"')" \
  NEXTAUTH_SECRET="$(grep '^NEXTAUTH_SECRET=' .env.development | cut -d= -f2- | tr -d '"')" \
  NEXTAUTH_URL="http://localhost:3000" \
  npm run start &
# wait for "Ready" in the log

export BASE_URL=http://localhost:3000
# get token via the curl method above (Aishwarya)

# Warmup + fresh token, then:
k6 run \
  --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" \
  --summary-export=load-tests/results/posts-scenario-a.json \
  load-tests/posts.js

kill %1
```

### 3. Scenario B — local app + local PostgreSQL

#### One-time DB setup (if not already done)

```sh
# Start a dedicated cluster (superuser=spacemonkey, port 5433, no SSL)
export PGDATA=/tmp/opencode/pgdata
mkdir -p /tmp/opencode /tmp/opencode/pgsock
initdb -D "$PGDATA" -U spacemonkey --auth=trust --encoding=UTF8
echo "port = 5433" >> "$PGDATA/postgresql.conf"
echo "listen_addresses = '127.0.0.1'" >> "$PGDATA/postgresql.conf"
echo "unix_socket_directories = '/tmp/opencode/pgsock'" >> "$PGDATA/postgresql.conf"
# HIGH connection limit (the app runs many queries; must not be the bottleneck)
echo "max_connections = 2000" >> "$PGDATA/postgresql.conf"
pg_ctl -D "$PGDATA" -l /tmp/opencode/pg.log start

createdb -h 127.0.0.1 -p 5433 -U spacemonkey spacemonkey_test

# Apply schema
DATABASE_URL="postgresql://spacemonkey@127.0.0.1:5433/spacemonkey_test" \
  npx prisma migrate deploy

# Seed data + Aishwarya
cp data-seed/spacemonkey_full.sql /tmp/opencode/load.sql
HASH=$(node -e "console.log(require('bcryptjs').hashSync('AtomQuest2026!',10))")
UUID=$(node -e "console.log(require('crypto').randomUUID())")
cat >> /tmp/opencode/load.sql <<EOF

INSERT INTO "User" ("id","email","passwordHash","name","bio","location","role","createdAt") VALUES
  ('$UUID','aishwarya.chakraborty@spacemonkey.com','$HASH','Aishwarya','Test account for load testing.','San Francisco, CA','user','2025-01-01T00:00:00.000Z');
EOF
psql -h 127.0.0.1 -p 5433 -U spacemonkey -d spacemonkey_test \
  -v ON_ERROR_STOP=1 -f /tmp/opencode/load.sql
```

#### Run

```sh
DATABASE_URL="postgresql://spacemonkey@127.0.0.1:5433/spacemonkey_test" \
  NEXTAUTH_SECRET="<any-secret>" \
  NEXTAUTH_URL="http://localhost:3000" \
  npm run start &
# wait for Ready

export BASE_URL=http://localhost:3000
# get token via curl method (Aishwarya is in the local DB)

# Warmup + fresh token, then:
k6 run \
  --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" \
  --summary-export=load-tests/results/posts-scenario-b.json \
  load-tests/posts.js

kill %1
```

> If you get huge `http_req_failed` rates under load with low latency, check the server log for
> `P2037 Too many database connections opened`. This means the DB connection limiter is the
> bottleneck. Either raise `max_connections` (above) or ensure `lib/db.ts` caches a singleton
> Prisma client (see note below).

---

## Comparing results

```sh
node scripts/compare-results.js
```

This reads `load-tests/results/posts-{prod,scenario-a,scenario-b}.json` and prints a
side-by-side p95 table plus a one-line interpretation for each pair.

Re-run it anytime you replace one of the result files.

---

## Thresholds (unchanged — do not loosen)

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

Thresholds are **not** modified to force a pass — the guide reports raw numbers regardless of outcome.

---

## Important gotchas

1. **Code state matters.** The production baseline was collected against the **original** deployed
   code (N+1 bug + per-request connection leak). Scenario A/B ran the **fixed** code (N+1 batched +
   singleton pool). For strict apples-to-apples, run all three against the same code build.
2. **Connection leak.** `lib/db.ts` MUST cache a singleton Prisma client (do NOT create a new
   `pg.Pool` per request). Under 30 VUs a per-request pool exhausts any local PG connection limit
   and produces misleading failures. The fix:
   ```ts
   export async function getDb() {
     if (globalForPrisma.prisma) return globalForPrisma.prisma;
     const pool = await createPool();
     const client = new PrismaClient({ adapter: new PrismaPg(pool) });
     globalForPrisma.prisma = client;   // cache in ALL environments
     return client;
   }
   ```
3. **Local PG SSL.** `lib/db.ts` detects `localhost`/`127.0.0.1` and skips SSL. If you use a real
   remote host in Scenario B, SSL will be enabled — keep `DATABASE_URL` pointing at localhost.
4. **Don't build against a raw-SQL-loaded Neon DB** (no Prisma migration tracking → `migrate deploy`
   fails). Build against a fresh local DB instead.
5. **Prod write endpoints looked "fast" in the baseline** because they mostly failed quickly
   (0% check success). Their low p95 is an artifact — an endpoint that fails fast isn't fast.
