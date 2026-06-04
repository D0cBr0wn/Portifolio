# Portfolio — Auboulot

Site d'artiste avec backoffice de gestion de concerts. Projet de portfolio démontrant la même application réalisée en plusieurs technologies frontend.

## Stack

| Couche | Technologie |
|---|---|
| Backend | Node.js · Express 5 · TypeScript · Prisma · PostgreSQL (via Docker) |
| Auth | JWT · TOTP MFA (Google Authenticator) · bcrypt |
| Frontend Vue | Vue 3 SPA · Vite · Vuetify 3 · Pinia · Vue Router 4 — port **5173** |
| Frontend React | React 19 · Vite · MUI v6 · Zustand v5 · React Router v7 — port **5174** |
| Frontend Angular | Angular 18 · Angular Material · Signals · HttpClient — port **5175** |
| Frontend Nuxt | Nuxt 3 · @nuxt/ui *(squelette, à venir)* |
| Shared | `@portfolio/shared` — classes TypeScript partagées (Show, Venue, types API) |
| Tests back | Jest · Supertest · Prisma mocké |
| Tests front Vue | Vitest · Vue Test Utils · Playwright E2E |
| Tests front React | Vitest · Testing Library · Playwright E2E |
| Tests front Angular | Jest · jest-preset-angular · Playwright E2E |
| Monorepo | pnpm workspaces |

## Prérequis

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker (pour le backend PostgreSQL)

## Installation

```bash
# Cloner le dépôt
git clone <url> && cd Portifolio

# Installer toutes les dépendances (tous les workspaces d'un coup)
pnpm install

# Compiler le package partagé (requis avant de lancer les frontends)
pnpm build:shared
```

## Configuration

### Backend — `back/.env`

Créer le fichier `back/.env` à partir de l'exemple :

```bash
cp back/.env.example back/.env
```

Variables requises :

```env
# Obligatoires
JWT_SECRET=<chaîne aléatoire d'au moins 32 caractères>
DATABASE_URL=postgresql://ooodbuser:password@localhost:5432/ooo_db
FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Optionnelles (alertes email sur tentatives suspectes)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
ADMIN_EMAIL=
```

> **Générer un JWT_SECRET sécurisé :**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Frontends — variable d'environnement *(optionnel)*

Les trois frontends utilisent `http://localhost:3000/api` par défaut. Pour pointer sur un autre backend :

```env
# front_vue/.env.local  |  front_react/.env.local  |  front_angular/src/environments/environment.ts
VITE_API_BASE=http://localhost:3000/api
```

## Base de données

Le backend utilise **PostgreSQL** via Docker. Le container est défini dans `back/docker-compose.yml`.

```bash
cd back

# Démarrer PostgreSQL + API
docker-compose up --build

# Première fois : appliquer les migrations dans le container
docker-compose exec -T api npx prisma migrate deploy

# Ouvrir Prisma Studio (pointe sur le PostgreSQL local, port 5432)
npx prisma studio
```

> Pour le développement local **sans Docker**, mettre à jour `DATABASE_URL` dans `back/.env` pour pointer sur un PostgreSQL accessible, puis lancer `npx prisma migrate deploy` localement.

## Lancer le projet

### Depuis la racine

```bash
pnpm dev:back      # API + PostgreSQL Docker (port 3000)
pnpm dev:vue       # Frontend Vue    (port 5173)
pnpm dev:react     # Frontend React  (port 5174)
pnpm dev:angular   # Frontend Angular (port 5175)
```

### Depuis chaque workspace

```bash
cd back        && pnpm dev   # port 3000
cd front_vue   && pnpm dev   # port 5173
cd front_react && pnpm dev   # port 5174
cd front_angular && pnpm dev # port 5175
```

### Avec Docker (backend + PostgreSQL)

```bash
cd back
docker-compose up --build
```

## Tests

### Tests unitaires

```bash
# Tous les workspaces d'un coup
pnpm test

# Par workspace
pnpm test:back     # Jest + Supertest (142 tests, seuil 70 %)
pnpm test:vue      # Vitest + Vue Test Utils
pnpm test:react    # Vitest + Testing Library
pnpm test:angular  # Jest + jest-preset-angular
pnpm test:shared   # Vitest (classes Show et Venue)
```

> `pnpm test` nécessite que le backend PostgreSQL soit accessible (`DATABASE_URL` configuré).

### Tests E2E Playwright

Les specs E2E interceptent l'API via `page.route()` — **le backend n'a pas besoin de tourner**.  
En revanche, **le frontend ciblé doit être démarré** (ou `webServer` dans `playwright.config.ts` le lance automatiquement).

```bash
cd front_vue     && pnpm test:e2e   # port 5173
cd front_react   && pnpm test:e2e   # port 5174
cd front_angular && pnpm test:e2e   # port 5175
```

## Structure du monorepo

```
Portifolio/
├── back/                    # @portfolio/back — API Express 5
│   ├── src/
│   │   ├── routes/          # shows, venues, users, auth, mfa, backoffice
│   │   ├── middleware/      # auth, rate limiting, IP ban, MFA, adminTrap
│   │   └── schemas/         # validation Zod
│   └── prisma/
│       └── schema.prisma
├── front_vue/               # @portfolio/front-vue — Vue 3 (port 5173)
│   └── src/
│       ├── services/        # api, show, venue, auth, user, backoffice
│       ├── stores/          # Pinia : auth, show, venue, user
│       ├── views/           # Home, Shows, Login, Register, backoffice/*
│       └── components/      # layouts, forms
├── front_react/             # @portfolio/front-react — React 19 (port 5174)
│   └── src/
│       ├── services/        # api, show, venue, auth, user, backoffice
│       ├── stores/          # Zustand : auth, show, venue, user
│       ├── pages/           # Home, Shows, Login, Register, backoffice/*
│       └── components/      # layouts, forms
├── front_angular/           # @portfolio/front-angular — Angular 18 (port 5175)
│   └── src/app/
│       ├── core/
│       │   ├── services/    # api, auth, show, venue, user, backoffice
│       │   ├── stores/      # Signals : auth, show, venue, user
│       │   └── guards/      # auth, admin, guest
│       ├── pages/           # home, shows, login, register, backoffice/*
│       └── layout/          # public, admin
├── front_nuxt/              # squelette Nuxt 3 (hors workspace, à venir)
├── packages/
│   └── shared/              # @portfolio/shared — types partagés
│       └── src/
│           ├── models/      # class Show, class Venue
│           └── types/       # ShowData, VenueData, UserData, AuthResponse…
├── pnpm-workspace.yaml
└── package.json             # scripts racine
```

## Flux d'authentification (MFA)

```
1. POST /api/auth/login  { email, password }
      → 200 { token }                        # MFA non activé → accès direct
      → 206 { mfaRequired, userId }          # MFA activé → étape 2
      → 206 { mfaSetupRequired, setupToken } # premier login, MFA à configurer

2. POST /api/mfa/verify  { userId, token }   # code Google Authenticator
      → 200 { token }                        # JWT final

3. Toutes les routes backoffice nécessitent : Authorization: Bearer <token>
4. Routes admin (/users, /backoffice/*) nécessitent role = ADMIN
```

## Workflow Git

- `main` — branche stable
- `dev` — branche d'intégration
- `feature/<nom>` ou `test/<nom>` — une branche par tâche, PR vers `dev`
