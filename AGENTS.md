# AGENTS.md

## Working directory
All commands run from the repo root. The API lives in Next.js route handlers under `app/api/`.

## Setup
- `git submodule update --init --recursive` — **required** before first run; the Stellarium Web Engine submodule lives at `public/stellarium-web-engine/`
- `npm install`

## Commands
```
npm run dev        # Next.js dev server with Turbopack
npm run build
npm run lint       # ESLint v9 flat config (next/core-web-vitals + next/typescript)
```
There is **no** `npm test` or `npm run typecheck`. Lint is the only code-quality gate.

## Architecture
- **Stellarium Web Engine** is a WASM submodule loaded via dynamic `<script>` injection in `hooks/useStellariumEngine.ts`. The engine has no published TypeScript types — the hand-crafted types in `types.ts` are the only source of truth for the engine's surface area.
- The Stellarium component is loaded at `/map` with `next/dynamic({ ssr: false })` — WASM cannot render server-side.
- Location state (`useObserverLocation`) is decoupled from the engine. `useSyncObserverLocation` pushes location edits into the live engine observer.
- The engine's `change` callback fires on every property update. `hovered` events are explicitly **filtered out** to avoid excessive re-renders.
- shadcn/ui ("new-york" style, RSC enabled), Tailwind CSS v4 (`@import "tailwindcss"` syntax), React 19, Next.js 15 App Router.

## Backend (API routes)
- **Database**: PostgreSQL (Neon). Prisma 7.9 with `@prisma/adapter-pg` + `pg` driver.
- **Auth**: next-auth v4 credentials provider. Session via JWT. `NEXTAUTH_SECRET` env var is **required** — the name is `NEXTAUTH_SECRET`, not `AUTH_SECRET`.
- **Prisma 7 quirks**: Requires a driver adapter. Client is generated to `generated/prisma/` (custom output path). Import from `@/generated/prisma/client` — NOT from `@prisma/client`.
- **IPv6 issue**: This machine can't reach IPv6 addresses. The `pg` library tries all DNS-resolved IPs in parallel but IPv6 times out first. The fix: resolve DNS to IPv4 manually (`dns.resolve4`) and pass the IP as `host` + `servername` in SSL options for SNI. This is in `lib/db.ts`.
- **Database URL**: Neon pooler endpoint, no query params needed. The `pg` library handles SSL via `ssl: { rejectUnauthorized: false, servername: hostname }`.

## Key files
| File | Purpose |
|------|---------|
| `types.ts` | Hand-written TypeScript definitions for the Stellarium WASM engine |
| `constants.ts` | Stellarium URIs, data sources, control toggles, default observer location |
| `hooks/useStellariumEngine.ts` | Engine script injection, initialization, and change-event bridge |
| `hooks/useObserverLocation.ts` | Manual/geolocate/city-search location state |
| `components/Stellarium.tsx` | "use client" orchestrator — canvas, controls, location drawer, object info |
| `utils/objectInfo.ts` | Astronomical data extraction from selected `StelObject` |
| `utils/wikipedia.ts` | Wikipedia API client for object summaries |
| `lib/db.ts` | Prisma client via `getDb()` — handles IPv4 DNS resolution + Neon SNI |
| `lib/auth.ts` | NextAuth config with credentials provider |
| `middleware.ts` | Protects `/dashboard` and `/profile` via next-auth middleware |

## Conventions
- `@/*` path alias maps to the frontend root (e.g. `@/components/ui/button`)
- Dark theme is the default (set in `layout.tsx` via `next-themes`)
- External APIs (Nominatim geocoding, Wikipedia) are called directly from the browser — no backend proxy
- Submodule paths must remain in `public/` so Next.js serves them as static assets