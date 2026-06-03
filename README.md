# Portfolio — Auboulot

Site d'artiste avec backoffice de gestion de concerts. Projet de portfolio démontrant la même application réalisée en plusieurs technologies frontend.

## Stack

| Couche | Technologie |
|---|---|
| Backend | Node.js · Express 5 · TypeScript · Prisma · SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT · TOTP MFA (Google Authenticator) · bcrypt |
| Frontend Vue | Vue 3 SPA · Vite · Vuetify 3 · Pinia · Vue Router 4 |
| Frontend Nuxt | Nuxt 3 · @nuxt/ui *(à venir)* |
| Frontend React | React *(à venir)* |
| Shared | `@portfolio/shared` — classes TypeScript partagées (Show, Venue) |
| Tests back | Jest · Supertest |
| Tests front | Vitest · Vue Test Utils · Playwright |
| Monorepo | pnpm workspaces |

## Prérequis

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)

## Installation

```bash
# Cloner le dépôt
git clone <url> && cd Portifolio

# Installer toutes les dépendances (tous les workspaces d'un coup)
pnpm install

# Compiler le package partagé (requis avant de lancer le frontend)
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
DATABASE_URL=file:./prisma/dev.db        # SQLite en dev
FRONTEND_URL=http://localhost:5173       # CORS

# Optionnelles (alertes email sur tentatives suspectes)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
ADMIN_EMAIL=
```

> **Générer un JWT_SECRET sécurisé :**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Frontend Vue — `front_vue/.env.local` *(optionnel)*

```env
VITE_API_BASE=http://localhost:3000/api  # valeur par défaut
```

## Base de données

```bash
# Créer/mettre à jour la base SQLite locale
cd back && npx prisma migrate dev

# Ouvrir Prisma Studio (interface graphique)
cd back && npx prisma studio
```

## Lancer le projet

### Depuis la racine (recommandé)

```bash
# Backend (port 3000)
pnpm dev:back

# Frontend Vue (port 5173) — dans un autre terminal
pnpm dev:vue
```

### Depuis chaque workspace

```bash
# Backend
cd back && pnpm dev

# Frontend Vue
cd front_vue && pnpm dev
```

### Avec Docker (backend + PostgreSQL)

```bash
cd back
docker-compose up --build

# Appliquer les migrations dans le container
docker-compose exec api npx prisma migrate dev
```

## Tests

```bash
# Tous les workspaces
pnpm test

# Par workspace
pnpm test:back     # Jest + Supertest
pnpm test:vue      # Vitest
pnpm test:shared   # Vitest (classes Show et Venue)

# Tests E2E (frontend doit être lancé)
cd front_vue && pnpm test:e2e
```

## Structure du monorepo

```
Portifolio/
├── back/                  # @portfolio/back — API Express
│   ├── src/
│   │   ├── routes/        # shows, venues, auth, mfa
│   │   ├── middleware/    # auth, rate limiting, IP ban, MFA
│   │   └── index.ts
│   └── prisma/
│       └── schema.prisma
├── front_vue/             # @portfolio/front-vue — Vue 3 SPA
│   └── src/
│       ├── models/        # (via @portfolio/shared)
│       ├── services/      # api.ts, venueService, showService, authService
│       ├── stores/        # Pinia : auth, venue, show
│       ├── views/         # Home, Shows, Login, backoffice/Venues, backoffice/Shows
│       └── components/    # PublicLayout, AdminLayout, forms
├── front_nuxt/            # @portfolio/front-nuxt — Nuxt 3 (à venir)
├── packages/
│   └── shared/            # @portfolio/shared — classes TypeScript
│       └── src/
│           ├── models/    # class Show, class Venue
│           └── types/     # interfaces API (ShowData, VenueData, AuthResponse…)
├── pnpm-workspace.yaml
└── package.json           # scripts racine
```

## Flux d'authentification (MFA)

```
1. POST /api/auth/login  { email, password }
      → 200 { token }           # si MFA non activé
      → 206 { mfaRequired, userId }  # si MFA activé

2. POST /api/mfa/verify  { userId, token }   # code Google Authenticator
      → 200 { token }           # JWT final

3. Toutes les routes backoffice nécessitent : Authorization: Bearer <token>
```

## Workflow Git

- `main` — branche stable
- `dev` — branche d'intégration
- `feature/<nom>` — une branche par tâche du backlog, PR vers `dev`

## Backlog

Voir [`.claude/plans/ce-projet-doit-devenir-whimsical-puzzle.md`](.claude/plans/ce-projet-doit-devenir-whimsical-puzzle.md) pour le backlog complet (~30 tâches, ~45h).
