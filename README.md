# Portfolio — Auboulot

Site d'artiste avec backoffice de gestion de concerts. Projet de portfolio démontrant la même application réalisée en plusieurs technologies frontend.

## Stack

| Couche | Technologie |
|---|---|
| Backend Node.js | Node.js · Express 5 · TypeScript · Prisma · PostgreSQL (via Docker) |
| Backend Python | Python 3.12 · FastAPI · SQLAlchemy 2 async · Alembic · Pydantic v2 |
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
- Python 3.12 (pour le backend Python et ses tests)
- `python3.12-venv` — module de création d'environnements virtuels Python, nécessaire pour isoler les dépendances du backend Python et lancer `pytest` en local (non inclus dans le paquet Python par défaut sur Debian/Ubuntu) :
  ```bash
  sudo apt install python3.12-venv
  ```

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

### Frontends — URL du backend *(optionnel)*

Vue et React utilisent une variable d'environnement Vite, Angular un fichier TypeScript :

```bash
# front_vue/.env.local  ou  front_react/.env.local
VITE_API_BASE=http://localhost:3000/api

# front_angular/src/environments/environment.ts
export const environment = { production: false, apiBase: 'http://localhost:3000/api' }
```

La valeur par défaut dans les trois cas est `http://localhost:3000/api`.

## Base de données

Le backend utilise **PostgreSQL** via Docker. Le container est défini dans `back/docker-compose.yml`.

```bash
cd back

# Démarrer PostgreSQL + API dans Docker (recommandé)
docker compose up --build

# Première fois : appliquer les migrations dans le container
docker compose exec -T api npx prisma migrate deploy

# Pré-remplir la base avec les données de démo (idempotent)
docker compose exec -T api npx prisma db seed

# Ouvrir Prisma Studio (pointe sur le PostgreSQL local, port 5432)
npx prisma studio
```

> **Sans Docker** : démarrer un PostgreSQL local, mettre `DATABASE_URL` à jour dans `back/.env`, puis `npx prisma migrate deploy` dans `back/`.

## Données de démonstration

Le seed recrée un jeu de données de référence (idempotent — relancer la commande remet la base dans son état initial) :

- 5 salles de concert
- 5 concerts (4 passés, 1 à venir)
- 3 comptes utilisateurs

| Email           | Mot de passe | Rôle  |
|-----------------|--------------|-------|
| test@test.com        | password     | ADMIN |
| superuser@test.com   | password     | ADMIN |
| user@test.com        | password     | USER  |

```bash
# Backend Node.js — avec Docker
docker compose exec -T api npx prisma db seed

# Backend Node.js — sans Docker (depuis back/)
npx prisma db seed

# Backend Python — avec Docker (depuis back_python/)
docker compose exec api python seed.py
```

## Lancer le projet

### Avec Docker (recommandé — hot-reload inclus)

```bash
cd back && docker compose up --build   # PostgreSQL + API sur :3000
```

Puis dans d'autres terminaux :

```bash
pnpm dev:vue       # port 5173
pnpm dev:react     # port 5174
pnpm dev:angular   # port 5175
```

## Tests

### Tests unitaires

340 tests au total répartis sur 5 suites.

```bash
# Tous les workspaces d'un coup
pnpm test

# Par workspace
pnpm test:back     # Jest + Supertest — 150 tests, seuil couverture 70 %
pnpm test:vue      # Vitest + Vue Test Utils — 55 tests
pnpm test:react    # Vitest + Testing Library — 65 tests
pnpm test:angular  # Jest + jest-preset-angular — 56 tests
pnpm test:shared   # Vitest — 14 tests (classes Show et Venue)

# Couverture (rapport HTML généré dans coverage/)
cd front_vue     && pnpm test:coverage
cd front_react   && pnpm test:coverage
cd front_angular && pnpm test:coverage
```

> `pnpm test` et `pnpm test:back` nécessitent que PostgreSQL soit accessible (`DATABASE_URL` configuré).

### Tests E2E Playwright

Les specs E2E mockent l'API via `page.route()` — **le backend n'a pas besoin de tourner**.  
Le frontend ciblé doit être démarré, ou `webServer` dans `playwright.config.ts` le lance automatiquement.

```bash
cd front_vue     && pnpm test:e2e   # port 5173 — auth, shows, backoffice
cd front_react   && pnpm test:e2e   # port 5174 — auth, shows, backoffice
cd front_angular && pnpm test:e2e   # port 5175 — auth, shows, backoffice
```

## Switcher de backend

Les deux backends exposent le **même contrat API** sur le port **3000**. Les trois frontends se reconnectent sans aucune modification de configuration.

### Backend Node.js (`back/`)

```bash
cd back && docker compose up --build
```

### Backend Python (`back_python/`)

```bash
cd back_python && docker compose up --build
docker compose exec api alembic upgrade head
docker compose exec api python seed.py
```

---

## Structure du monorepo

```
Portifolio/
├── back/                    # @portfolio/back — API Express 5
├── back_python/             # API FastAPI Python — même contrat que back/
│   ├── app/
│   │   ├── routers/         # shows, venues, users, auth, mfa, backoffice
│   │   ├── middleware/      # ip_ban
│   │   └── schemas.py       # validation Pydantic
│   └── alembic/             # migrations SQLAlchemy
├── front_vue/               # @portfolio/front-vue  — Vue 3 (port 5173)
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
├── front_nuxt/              # squelette Nuxt 3 (hors workspace pnpm, à venir)
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
      → 206 { mfaSetupRequired, setupToken } # premier login, MFA à configurer → étape 2b

2.  POST /api/mfa/login   { userId, token }  # code TOTP (MFA activé)
      → 200 { token }                        # JWT final

2b. POST /api/mfa/setup   {}  (Authorization: Bearer <setupToken>)
      → 200 { qrCodeDataURL, secret }        # QR code à scanner
    POST /api/mfa/verify  { token }          # confirmer avec le code TOTP
      → 200 { token }                        # JWT final

3. Toutes les routes backoffice nécessitent : Authorization: Bearer <token>
4. Routes admin (/users, /backoffice/*) nécessitent role = ADMIN
```

## Workflow Git

- `main` — branche stable
- `dev` — branche d'intégration
- `feature/<nom>` ou `test/<nom>` — une branche par tâche, PR vers `dev`
