# SpaceMonkey

An interactive astronomy web application powered by the Stellarium Web Engine. Explore the night sky, log observations, connect with communities of stargazers, follow other astronomers, and track celestial events.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4, shadcn/ui |
| Backend | Next.js API Routes (no separate server) |
| Database | PostgreSQL (Neon), Prisma 7.9 ORM with driver adapter |
| Auth | next-auth v4 with credentials + JWT |
| Sky Map | Stellarium Web Engine (WASM — loaded client-side) |

## Features

- **Interactive Star Map** — Real-time sky simulation powered by Stellarium Web Engine with auto-geolocation
- **Community Hubs** — Join, create, and moderate topic-specific sub-communities (e.g., `c/astrophotography`)
- **Community Posts** — Create, upvote, comment on astronomy posts with category tags
- **Following System** — Follow other astronomers, view a curated feed of their posts
- **Stargazing Logs** — Record observations with object names, types, constellations, descriptions, and star ratings
- **Favorites** — Save celestial objects from the star map for quick reference
- **Celestial Events** — Calendar of real astronomical events (meteor showers, eclipses, planetary alignments)
- **User Profiles** — Custom bio, location, editable profile; public profile with follower stats, recent posts, observations, and community memberships
- **Discover & Search** — Find users, communities, and posts via the global Cmd+K command palette

## Getting Started

```bash
git submodule update --init --recursive
npm install
cp .env .env.development   # or edit .env directly
```

Required env vars in `.env`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooler endpoint) |
| `NEXTAUTH_SECRET` | Random key for JWT signing (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |

Apply migrations and start the dev server:

```bash
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Apply pending DB migrations, regenerate Prisma client, then production build |
| `npm run lint` | ESLint (next/core-web-vitals + next/typescript) |
| `npx prisma migrate dev --create-only --name <name>` | Generate a new migration from schema changes (dry-run, doesn't apply) |
| `npx prisma migrate deploy` | Apply all unapplied migrations to the current database |
| `npx prisma generate` | Regenerate Prisma client |

## Deployment

- **Hosting**: Render — auto-deploys on push to `main`
- **Database**: Neon PostgreSQL — production DB URL set via `DATABASE_URL` env var in Render dashboard
- **Build command**: `npm run build` runs `prisma migrate deploy && prisma generate && next build` — migrations are applied automatically every deploy
- **Required env vars in Render dashboard**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (all must be available during the build phase)

## Project Structure

```
SpaceMonkey/
├── app/                    # App Router pages + API routes
│   ├── api/                # Backend API endpoints
│   │   ├── auth/           # Register, sign-in
│   │   ├── users/          # Profiles, follow, search, top users
│   │   ├── posts/          # CRUD, comments, votes, following feed
│   │   ├── communities/    # CRUD, join/leave, member management
│   │   ├── observations/   # Observation logs
│   │   ├── favorites/      # Saved celestial objects
│   │   └── stats/          # Global site stats
│   ├── c/                  # Community-specific pages /c/[slug]
│   ├── community/          # Community feed + post detail
│   ├── dashboard/          # Protected dashboard
│   ├── events/             # Celestial events calendar
│   ├── map/                # Stellarium star map
│   ├── profile/            # Own profile + public profiles /profile/[id]
│   ├── search/             # Discover users, communities, posts
│   └── auth/               # Login / register
├── components/             # React components (shadcn/ui + custom)
│   ├── ui/                 # shadcn/ui primitives
│   ├── community/          # PostCard, FeedSidebar, CommunityBadge, etc.
│   ├── profile/            # FollowersDialog
│   └── ...
├── hooks/                  # Custom React hooks (Stellarium engine, location)
├── lib/                    # Prisma client, auth config, API helpers, shared types
├── prisma/                 # Schema + migration files
├── public/                 # Static assets + Stellarium WASM build
└── utils/                  # Astronomy helpers, Wikipedia client, post utilities
```

## License

MIT
