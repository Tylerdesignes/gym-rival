# Gym Rival

A web-first gym app MVP built with Next.js patterns and a shared training engine for:

- first-use baseline assessments,
- progressive muscle-building plans,
- benchmark-driven tiers and leaderboards,
- rivalry challenges between users.

## Status

The app now supports two storage modes:

- demo mode with the existing in-memory repository when `DATABASE_URL` is not set,
- production mode with Prisma + Postgres when `DATABASE_URL` is set.

## Quick start

```bash
npm install
npm run db:generate
npm run dev
```

To use a real database locally:

```bash
cp .env.example .env
# set DATABASE_URL to your Postgres connection string
npm run db:push
npm run dev
```

## Included APIs

- `POST /api/onboarding/baseline`
- `POST /api/plans/generate`
- `POST /api/workouts/custom`
- `POST /api/workouts/:id/log-session`
- `GET /api/ranks/me`
- `GET /api/leaderboards`
- `POST /api/challenges`
- `POST /api/challenges/:id/join`

## Storage

`lib/data-store.ts` now auto-selects between:

- `lib/memory-store.ts` for self-contained demo mode
- `lib/database-store.ts` for Prisma-backed Postgres mode

The Prisma schema lives in `prisma/schema.prisma`, and the original SQL reference remains in `data/postgres-schema.sql`.

## Deploying To Vercel

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Create a Postgres database from the Vercel Marketplace or connect an external provider.
4. Add `DATABASE_URL` in the Vercel project environment variables.
5. In Vercel project settings, set the Build Command to `npm run vercel-build`.
6. For local setup, run `npm run db:migrate:deploy` against the target database once if you want to apply the checked-in migration manually before the first deploy.
7. Redeploy.

On first run with an empty database, the app seeds the demo users, plans, challenges, progress metrics, and benchmark standards automatically.

### Recommended Vercel Flow

1. Create a new Vercel project from this repo.
2. Add a Postgres integration from the Vercel Marketplace and copy the injected `DATABASE_URL`.
3. In Vercel:
   Build Command: `npm run vercel-build`
4. Keep the default Output setting for Next.js.
5. Deploy `main`.

### Local Database Commands

```bash
npm run db:generate
npm run db:migrate:deploy
npm run dev
```

### Notes

- `postinstall` now runs `prisma generate`, so Vercel installs will generate the Prisma client automatically.
- `vercel-build` runs `prisma migrate deploy` before `next build`, which is the safer production path than `db push`.
- Preview deployments should ideally use a separate preview database so schema changes do not hit production.
