# Portfolio

This portfolio project, based on a simplified music venue website, demonstrates the same application built with multiple frontend technologies, backed by two interchangeable backends exposing the same API contract.

## Tech stack

The repository is organized as a pnpm monorepo. It contains two interchangeable backends (Node.js and Python), three independent frontends (Vue, React, Angular), and a shared TypeScript types package used by all frontends.

| Layer               | Technology                                                               |
| ------------------- | ------------------------------------------------------------------------ |
| Node.js Backend     | Node.js · Express 5 · TypeScript · Prisma · PostgreSQL (via Docker)      |
| Python Backend      | Python 3.12 · FastAPI · SQLAlchemy 2 async · Alembic · Pydantic v2       |
| Auth                | JWT · TOTP MFA (Google Authenticator) · bcrypt                           |
| Vue Frontend        | Vue 3 SPA · Vite · Vuetify 3 · Pinia · Vue Router 4 — port **5173**      |
| React Frontend      | React 19 · Vite · MUI v6 · Zustand v5 · React Router v7 — port **5174**  |
| Angular Frontend    | Angular 18 · Angular Material · Signals · HttpClient — port **5175**     |
| Nuxt Frontend       | Nuxt 3 · @nuxt/ui _(skeleton, coming soon)_                              |
| Shared              | `@portfolio/shared` — shared TypeScript classes (Show, Venue, API types) |
| Back tests          | Jest · Supertest · mocked Prisma                                         |
| Vue front tests     | Vitest · Vue Test Utils · Playwright E2E                                 |
| React front tests   | Vitest · Testing Library · Playwright E2E                                |
| Angular front tests | Jest · jest-preset-angular · Playwright E2E                              |
| Monorepo            | pnpm workspaces                                                          |

## Authentication and MFA

The application implements JWT authentication with optional MFA via TOTP (Google Authenticator). On first login, the user is guided through setting up their authenticator app. Subsequent logins prompt for the 6-digit code if MFA is enabled.

```
1. POST /api/auth/login  { email, password }
      → 200 { token }                        # MFA not enabled → direct access
      → 206 { mfaRequired, userId }          # MFA enabled → step 2
      → 206 { mfaSetupRequired, setupToken } # first login, MFA to configure → step 2b

2.  POST /api/mfa/login   { userId, token }  # TOTP code (MFA enabled)
      → 200 { token }                        # final JWT

2b. POST /api/mfa/setup   {}  (Authorization: Bearer <setupToken>)
      → 200 { qrCodeDataURL, secret }        # QR code to scan
    POST /api/mfa/verify  { token }          # confirm with the TOTP code
      → 200 { token }                        # final JWT

3. All backoffice routes require: Authorization: Bearer <token>
4. Admin routes (/users, /backoffice/*) require role = ADMIN
```

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker (for the PostgreSQL backend)
- Python 3.12 (for the Python backend and its tests)
- `python3.12-venv` — required to isolate Python backend dependencies (not included by default on Debian/Ubuntu):
  ```bash
  sudo apt install python3.12-venv
  ```

## Installation

```bash
# 1. Clone the repository
git clone <url> && cd Portifolio

# 2. Install all dependencies (all workspaces at once)
pnpm install

# 3. Build the shared package (required before starting the frontends)
pnpm build:shared
```

### Backend configuration — `back/.env`

```bash
cp back/.env.example back/.env
```

Required variables:

```env
# Required
JWT_SECRET=<random string of at least 32 characters>
DATABASE_URL=postgresql://ooodbuser:password@localhost:5432/ooo_db
FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Optional (email alerts on suspicious login attempts)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
ADMIN_EMAIL=
```

> **Generate a secure JWT_SECRET:**
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Database

```bash
cd back

# Start PostgreSQL + API in Docker (recommended)
docker compose up --build

# Apply migrations
docker compose exec -T api npx prisma migrate deploy

# Seed the database with demo data (idempotent)
docker compose exec -T api npx prisma db seed
```

### Switching backends

Both backends expose the **same API contract** on port **3000**. All three frontends reconnect without any configuration change.

```bash
# Node.js backend
cd back && docker compose up --build

# Python backend
cd back_python && docker compose up --build
docker compose --project-directory back_python exec api alembic upgrade head
docker compose --project-directory back_python exec api python seed.py
```

### Frontend configuration _(optional)_

The default value is `http://localhost:3000/api`. To change it:

```bash
# front_vue/.env.local  or  front_react/.env.local
VITE_API_BASE=http://localhost:3000/api

# front_angular/src/environments/environment.ts
export const environment = { production: false, apiBase: 'http://localhost:3000/api' }
```

## Usage

### Running the project

```bash
# Backend + database (Docker, hot-reload included)
cd back && docker compose up --build   # API on :3000
```

Then in separate terminals:

```bash
pnpm dev:vue       # port 5173
pnpm dev:react     # port 5174
pnpm dev:angular   # port 5175
```

### Demo accounts

The seed creates 5 venues, 5 shows (4 past, 1 upcoming) and 3 accounts:

| Email              | Password | Role  | MFA                             |
| ------------------ | -------- | ----- | ------------------------------- |
| test@test.com      | password | ADMIN | —                               |
| superuser@test.com | password | ADMIN | TOTP pre-configured (see below) |
| user@test.com      | password | USER  | —                               |

> **superuser MFA** — The `superuser@test.com` account has MFA enabled with the fixed TOTP secret
> `JBSWY3DPEHPK3PXP`. Use any authenticator app or generate a code with
> `pyotp.TOTP('JBSWY3DPEHPK3PXP').now()`. The E2E test suites rely on this account having MFA enabled.

### Tests

340 unit tests spread across 5 suites.

```bash
# All workspaces at once
pnpm test

# Per workspace
pnpm test:back     # Jest + Supertest — 150 tests, 70% coverage threshold
pnpm test:vue      # Vitest + Vue Test Utils — 55 tests
pnpm test:react    # Vitest + Testing Library — 65 tests
pnpm test:angular  # Jest + jest-preset-angular — 56 tests
pnpm test:shared   # Vitest — 14 tests (Show and Venue classes)

# Coverage (HTML report generated in coverage/)
cd front_vue     && pnpm test:coverage
cd front_react   && pnpm test:coverage
cd front_angular && pnpm test:coverage
```

> `pnpm test` and `pnpm test:back` require PostgreSQL to be accessible (`DATABASE_URL` configured).

### Playwright E2E tests

E2E specs mock the API via `page.route()` — **the backend does not need to be running**.

```bash
cd front_vue     && pnpm test:e2e   # port 5173 — auth, shows, backoffice
cd front_react   && pnpm test:e2e   # port 5174 — auth, shows, backoffice
cd front_angular && pnpm test:e2e   # port 5175 — auth, shows, backoffice
```

### Prisma Studio

The database can be browsed using Prisma Studio:

```bash
# Open the Prisma Studio interface (points to local PostgreSQL, port 5432)
npx prisma studio
```
