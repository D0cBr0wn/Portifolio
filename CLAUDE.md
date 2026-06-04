# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Odyssey of One" — a full-stack app with a Node.js/Express backend (`back/`) and a Nuxt 3 frontend (`front/`). `front_old/` is a deprecated version; ignore it.

## Backend (`back/`)

```bash
npm run dev        # nodemon + ts-node, hot reload on :3000
npm run build      # tsc → dist/
npm run lint       # eslint
npm run lint:fix   # eslint --fix
npm run format     # prettier
```

**Docker (preferred for running the API):**
```bash
docker compose up --build          # starts API on :3000
docker compose exec api npx prisma migrate dev   # run migrations inside container
```
> Use `docker compose` (no hyphen, V2 plugin). `docker-compose` v1.29.2 is incompatible with Docker Engine 29+.

**Prisma:**
- Schema: `prisma/schema.prisma`
- Client generated to `generated/prisma_client/` (non-default path) — always import from `../../generated/prisma_client`
- Local dev uses SQLite (`prisma/dev.db`); Docker uses PostgreSQL via `DATABASE_URL`
- After schema changes: `npx prisma migrate dev` (local) or `docker compose exec api npx prisma migrate dev` (Docker)

## Frontend (`front/`)

```bash
npm run dev        # nuxt dev, hot reload
npm run build      # nuxt build
npm run generate   # static generation
npm run preview    # preview production build
```

Modules: `@nuxt/ui`, `@nuxt/icon`, `@nuxt/eslint`, `@nuxt/test-utils`.

## Architecture

- **Backend**: Express 5 + TypeScript. Routes in `src/routes/` are mounted at `/shows` and `/venues`. Each route file instantiates its own `PrismaClient`. Request bodies validated with Zod schemas before hitting Prisma. Logging via Pino (`src/logger.ts`).
- **Frontend**: Nuxt 3, currently being built from scratch. `front_old/` used Vuetify + Pinia and can serve as reference for patterns.
- **Data models**: `Show` (id, label, date, venueId) belongs to `Venue` (id, name, city).
