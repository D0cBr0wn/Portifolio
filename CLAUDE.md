# CLAUDE.md

## Project Overview

Odyssey of One is a technical showcase project used to demonstrate full-stack engineering skills for job opportunities.

The repository contains:

- A Node.js / Express / TypeScript backend (`back/`)
- Three independent front-end implementations exposing the same business domain:
  - Vue
  - React
  - Angular

The goal is to showcase architecture, API design, testing, TypeScript, and multi-framework front-end development.

---

## Working Rules

Before making changes:

1. Analyze existing code patterns.
2. Follow the established architecture.
3. Prefer minimal, targeted changes.
4. Do not refactor unrelated code.
5. Ask before introducing new dependencies.
6. Keep implementations simple and maintainable.

---

## Repository Exploration

Never explore or analyze:

- node_modules/
- dist/
- build/
- .next/
- coverage/
- logs/
- generated assets
- lock files unless explicitly required

Focus on source code and configuration files only.

---

## Plans

Always write plans in:

.claude/plans/

Never write plans in:

~/.claude/
~/.claude/plans/
or any external location.

Plan requirements:

- Always include backend and frontend test work when relevant.
- After creating the plan, create a prioritized backlog.
- Backlog items should be sized to approximately 1–3 hours of work each and time must be mentionned.
- Each backlog item should be independently deliverable.
- Each backlog item should be suitable for a separate commit and pull request.
- Prefer small, reviewable changes over large batches of work.
- Identify dependencies between backlog items.

---

## Scope Control

When asked to implement a feature:

- Modify only files directly related to the feature.
- Do not refactor unrelated code.
- Do not rename files unless explicitly requested.
- Do not change architecture unless explicitly requested.
- Prefer consistency with the existing codebase over introducing new patterns.

## Execution / GIT

- always work from the dev branch
- each backlog task must be in a git feature branch created from dev
- implement the backlog item on that branch, then commit and open a PR before moving to the next item
- do not implement multiple backlog items before making PRs — each item is a full cycle: branch → implement → commit → PR
- your pull requests must ALWAYS be from your feature to dev, unless it's small or emergency fix.

## Backend

Location:

back/

Stack:

- Express 5
- TypeScript
- Prisma
- Zod
- Pino

Useful commands:

```bash
npm run dev
npm run build
npm run lint
npm run lint:fix
npm run format
```

### Docker

Preferred way to run the API:

```bash
docker-compose up --build
docker-compose exec api npx prisma migrate dev
```

### Prisma

Schema:

```text
prisma/schema.prisma
```

Important:

- Prisma client is generated into `generated/prisma_client/`
- Always import Prisma from `generated/prisma_client`
- Local development uses SQLite
- Docker uses PostgreSQL through `DATABASE_URL`

After schema changes:

```bash
npx prisma migrate dev
```

or

```bash
docker-compose exec api npx prisma migrate dev
```

---

## Frontends

This repository intentionally contains multiple front-end implementations.

Do not assume a single front-end framework.

When working on a front-end task, first identify whether the target application is:

- Vue
- React
- Angular

and follow framework-specific conventions.

---

## Domain Model

Venue

- id
- name
- city

Show

- id
- label
- date
- venueId

Relationships:

- A Show belongs to a Venue.

---

## Architecture Notes

- Routes are mounted under `/shows` and `/venues`
- Request validation uses Zod
- Logging uses Pino
- Follow existing patterns before introducing new abstractions
