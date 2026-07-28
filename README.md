# SpaceMonkey

An interactive astronomy web application powered by the Stellarium Web Engine. Explore the night sky, log observations, connect with a community of stargazers, and track celestial events.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4 |
| Backend | Next.js API Routes (no separate server) |
| Database | PostgreSQL (Neon), Prisma 7.9 ORM |
| Auth | next-auth v4 with credentials + JWT |
| Sky Map | Stellarium Web Engine (WASM submodule) |

## Features

- **Interactive Star Map** — Real-time sky powered by Stellarium Web Engine
- **Community Posts** — Create, upvote, comment on astronomy posts
- **Stargazing Logs** — Record observations with ratings and descriptions
- **Favorites** — Save celestial objects from the star map
- **Celestial Events** — Calendar of 15+ real astronomical events
- **User Profiles** — Custom bio, location, observation history

## Getting Started

```bash
git submodule update --init --recursive
npm install
cp .env.example .env   # add DATABASE_URL, NEXTAUTH_SECRET
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm run lint` | ESLint (next/core-web-vitals + next/typescript) |
| `npx prisma migrate deploy` | Apply DB migrations |
| `npx prisma generate` | Regenerate Prisma client |

## Project Structure

```
SpaceMonkey/
├── app/              # App Router pages + API routes
│   ├── api/          # Backend API endpoints
│   ├── community/    # Community posts + post detail
│   ├── dashboard/
│   ├── events/       # Celestial events calendar
│   ├── map/          # Stellarium star map
│   ├── profile/
│   └── auth/         # Login / register
├── components/       # React components (shadcn/ui + custom)
├── hooks/            # Custom React hooks
├── lib/              # Prisma client, auth config, API helpers
├── prisma/           # Schema + migrations
├── public/           # Static assets + Stellarium WASM
└── utils/            # Astronomy helpers, Wikipedia client
```

## License

MIT
