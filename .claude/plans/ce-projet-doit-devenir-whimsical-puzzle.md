# Plan : Portfolio artiste — Monorepo pnpm + Vue 3 SPA + Backend Auth/MFA

---

## Workflow Git

- Branche principale d'intégration : **`dev`** (à créer depuis `main`)
- Chaque tâche = une branche `feature/<slug>` créée depuis `dev`
- Chaque tâche = une PR vers `dev`
- `main` ne reçoit que des merges stables depuis `dev`

**Première action :** `git checkout -b dev`

---

## Backlog (tâches 1-3h, ordonnées)

### 🏗️ Monorepo
| # | Branche feature | Tâche | Durée |
|---|---|---|---|
| 1 | `feature/monorepo-setup` | Créer `pnpm-workspace.yaml`, `package.json` racine (scripts, workspaces), ajouter `"name": "@portfolio/back"` dans `back/package.json` | 1h |

### 📦 Package partagé `@portfolio/shared`
| # | Branche feature | Tâche | Durée |
|---|---|---|---|
| 2 | `feature/shared-init` | Init `packages/shared/` : `package.json`, `tsconfig.json`, structure `src/models/` + `src/types/` | 1h |
| 3 | `feature/shared-venue-class` | Implémenter `class Venue` avec `VenueData`, `getFullAddress()` + tests Vitest complets | 1h |
| 4 | `feature/shared-show-class` | Implémenter `class Show` avec `ShowData`, `getFormattedDate()`, instanciation `Venue` imbriquée + tests Vitest | 1h |

### ⚙️ Backend — Setup & Auth
| # | Branche feature | Tâche | Durée |
|---|---|---|---|
| 5 | `feature/back-deps` | Ajouter toutes les dépendances manquantes dans `back/package.json` (zod, cors, bcryptjs, jwt, speakeasy, qrcode, nodemailer, rate-limit, dotenv + types + jest) | 1h |
| 6 | `feature/back-prisma-schema` | Mettre à jour `back/prisma/schema.prisma` : User, IpBan, FailedLoginAttempt ; enrichir Venue (address1, address2, zipCode) ; migration | 1h |
| 7 | `feature/back-auth-routes` | Cherry-pick `back/src/routes/auth.ts` et `back/src/routes/mfa.ts` depuis `origin/feature/mfa`, adapter aux nouvelles deps | 2h |
| 8 | `feature/back-auth-middlewares` | Cherry-pick les 5 middlewares (`authMiddleware`, `loginAttemptMiddleware`, `rateLimiterMiddleware`, `ipBanMiddleware`, `adminTrapMiddleware`) | 2h |
| 9 | `feature/back-api-wiring` | Mettre à jour `back/src/index.ts` : prefix `/api`, monter routes auth/mfa, protéger POST shows/venues, CORS strict, créer `.env.example` | 1h |

### 🧪 Tests Backend
| # | Branche feature | Tâche | Durée |
|---|---|---|---|
| 10 | `feature/back-test-auth-middleware` | Tests unitaires : `authMiddleware` (JWT valide/expiré/absent/malformé) + `ipBanMiddleware` (IP bannie/expirée) | 1h30 |
| 11 | `feature/back-test-security-middlewares` | Tests unitaires : `loginAttemptMiddleware` (comptage échecs, ban) + `adminTrapMiddleware` | 1h |
| 12 | `feature/back-test-validation` | Tests unitaires : schemas Zod `showSchema` et `venueSchema` (cas valides et invalides) | 1h |
| 13 | `feature/back-test-auth-routes` | Tests d'intégration : `POST /api/auth/register` + `POST /api/auth/login` (message générique, MFA → 206, IP bannie) | 2h |
| 14 | `feature/back-test-mfa-routes` | Tests d'intégration : `POST /api/mfa/setup` et `POST /api/mfa/verify` (sans auth, code invalide/valide) | 1h30 |
| 15 | `feature/back-test-shows-venues` | Tests d'intégration : routes shows/venues (GET public, POST sans auth → 401, POST avec auth → 201) + rate limiting | 1h30 |

### 🖥️ Frontend Vue 3 SPA
| # | Branche feature | Tâche | Durée |
|---|---|---|---|
| 16 | `feature/vue-init` | Vider `front_vue/`, initialiser SPA Vite + Vue 3 + TypeScript, configurer Vuetify 3, Vue Router, Pinia, ajouter `@portfolio/shared: workspace:*` | 2h |
| 17 | `feature/vue-api-service` | Implémenter `api.ts` (fetch wrapper, Authorization header, intercepteur 401 → logout + redirect) + `authService.ts` | 1h30 |
| 18 | `feature/vue-data-services` | Implémenter `venueService.ts` et `showService.ts` (retour en instances Venue et Show de `@portfolio/shared`) | 1h |
| 19 | `feature/vue-stores` | Implémenter les 3 stores Pinia : `authStore` (token sessionStorage, isAuthenticated), `venueStore`, `showStore` | 1h30 |
| 20 | `feature/vue-router` | Configurer `router/index.ts` : 5 routes, guard `/backoffice/*` → redirect `/login` | 1h |
| 21 | `feature/vue-layouts` | Créer `PublicLayout.vue` (dark theme, header, footer) et `AdminLayout.vue` (light theme) avec Vuetify | 1h30 |
| 22 | `feature/vue-public-pages` | Implémenter `HomeView.vue` (présentation artiste) et `ShowsView.vue` (liste concerts avec dates formatées) | 2h |
| 23 | `feature/vue-login` | Implémenter `LoginView.vue` : étape 1 (email + password), étape 2 conditionnelle (code MFA 6 chiffres) | 2h |
| 24 | `feature/vue-backoffice-venues` | Implémenter `backoffice/VenuesView.vue` : tableau Vuetify + `VenueForm.vue` (dialog de création) | 2h |
| 25 | `feature/vue-backoffice-shows` | Implémenter `backoffice/ShowsView.vue` : tableau concerts + `ShowForm.vue` (select venue, date picker) | 2h |

### 🧪 Tests Frontend
| # | Branche feature | Tâche | Durée |
|---|---|---|---|
| 26 | `feature/vue-test-services` | Tests Vitest : `venueService` et `showService` (mock fetch, retour en instances de classe) | 1h30 |
| 27 | `feature/vue-test-stores` | Tests Vitest : `authStore` (login → sessionStorage, logout, isAuthenticated) | 1h |
| 28 | `feature/vue-test-components` | Tests Vue Test Utils : `VenueForm` (validation, emit), `LoginView` (step MFA), route guard (redirect sans token) | 2h |
| 29 | `feature/vue-e2e-auth` | Tests E2E Playwright : `auth.spec` (login complet avec MFA → accès backoffice → logout) | 2h |
| 30 | `feature/vue-e2e-app` | Tests E2E Playwright : `shows.spec` (page publique sans auth) + `backoffice.spec` (créer venue, créer show) | 2h |

**Total estimé : ~45h**

---

## Context

Transformer le projet "Odyssey of One" en portfolio de recherche d'emploi. Site d'artiste (Auboulot) avec backoffice de gestion de concerts. Même frontend en 3 technos (Vue 3 SPA, Nuxt, React). On commence par **Vue 3 SPA**.

L'auth/MFA existe déjà sur `origin/feature/mfa` — cherry-pick des fichiers plutôt que réécriture.

---

## Structure cible du monorepo

```
Portifolio/
├── pnpm-workspace.yaml
├── package.json                 # scripts racine, devDependencies globales
├── back/                        # @portfolio/back — Express + Prisma
├── front_vue/                   # @portfolio/front-vue — Vue 3 SPA
├── front_nuxt/                  # @portfolio/front-nuxt — Nuxt 3 (plus tard)
├── front_react/                 # @portfolio/front-react — React (plus tard)
└── packages/
    └── shared/                  # @portfolio/shared — modèles TypeScript partagés
```

---

## Phase 0 — Setup monorepo pnpm

### 0.1 Fichiers racine à créer
**`pnpm-workspace.yaml` :**
```yaml
packages:
  - 'back'
  - 'front_vue'
  - 'front_nuxt'
  - 'packages/*'
```

**`package.json` (racine) :**
```json
{
  "name": "portfolio",
  "private": true,
  "scripts": {
    "dev:back": "pnpm --filter @portfolio/back dev",
    "dev:vue": "pnpm --filter @portfolio/front-vue dev",
    "test": "pnpm -r test",
    "test:back": "pnpm --filter @portfolio/back test",
    "test:vue": "pnpm --filter @portfolio/front-vue test",
    "lint": "pnpm -r lint",
    "build": "pnpm -r build"
  }
}
```

### 0.2 Package `@portfolio/shared`
**`packages/shared/`** — TypeScript pur, zéro dépendance runtime, compilé en ESM + types.

```
packages/shared/
├── src/
│   ├── models/
│   │   ├── Venue.ts       # class Venue
│   │   └── Show.ts        # class Show
│   ├── types/
│   │   └── api.ts         # interfaces des req/res API (ShowData, VenueData, AuthResponse…)
│   └── index.ts           # re-exports
├── package.json           # name: @portfolio/shared, exports, main
└── tsconfig.json
```

**Classes (pattern clé du portfolio) :**

```typescript
// src/models/Venue.ts
export interface VenueData {
  id: number; name: string; city: string
  address1?: string; address2?: string; zipCode?: string
}
export class Venue {
  id: number; name: string; city: string
  address1?: string; address2?: string; zipCode?: string

  constructor(data: VenueData) { Object.assign(this, data) }

  getFullAddress(): string {
    return [this.address1, this.address2, this.zipCode, this.city]
      .filter(Boolean).join(', ')
  }
}

// src/models/Show.ts
export interface ShowData {
  id: number; label: string; date: string
  venueId: number; venue?: VenueData
}
export class Show {
  id: number; label: string; date: Date; venueId: number; venue?: Venue

  constructor(data: ShowData) {
    this.id = data.id; this.label = data.label
    this.date = new Date(data.date)
    this.venueId = data.venueId
    this.venue = data.venue ? new Venue(data.venue) : undefined
  }

  getFormattedDate(): string {
    return this.date.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }
}
```

---

## Phase 1 — Backend : consolider et intégrer l'auth

### 1.1 Mettre à jour `back/package.json`
- Ajouter `"name": "@portfolio/back"` et `"workspace": true`
- Dépendances manquantes : `zod`, `cors`
- Dépendances auth : `bcryptjs`, `jsonwebtoken`, `speakeasy`, `qrcode`, `nodemailer`, `express-rate-limit`, `dotenv`
- Types : `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/speakeasy`, `@types/qrcode`, `@types/nodemailer`
- Tests : `jest`, `ts-jest`, `supertest`, `@types/supertest`, `@types/jest`

### 1.2 Mettre à jour le schéma Prisma
**`back/prisma/schema.prisma`** — ajouter :
```prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String
  mfaSecret String?
  banUntil  DateTime?
}

model IpBan {
  ip        String   @id
  reason    String
  expiresAt DateTime
}

model FailedLoginAttempt {
  id         Int      @id @default(autoincrement())
  ip         String
  emailTried String
  date       DateTime
}
```
Enrichir `Venue` avec `address1?`, `address2?`, `zipCode?`.

### 1.3 Cherry-pick depuis `origin/feature/mfa`
Fichiers à récupérer :
- `back/src/routes/auth.ts` — POST `/auth/register`, POST `/auth/login`
- `back/src/routes/mfa.ts` — POST `/mfa/setup`, POST `/mfa/verify`
- `back/src/middleware/authMiddleware.ts`
- `back/src/middleware/loginAttemptMiddleware.ts`
- `back/src/middleware/rateLimiterMiddleware.ts`
- `back/src/middleware/ipBanMiddleware.ts`
- `back/src/middleware/adminTrapMiddleware.ts`

### 1.4 Mettre à jour `back/src/index.ts`
```typescript
app.use('/api/shows', showRoutes)
app.use('/api/venues', venueRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/mfa', mfaRoutes)
```
- GET `/api/shows`, GET `/api/venues` → publiques
- POST `/api/shows`, POST `/api/venues` → protégées par `authMiddleware`

### 1.5 Sécurité
- **CORS strict** : `cors({ origin: process.env.FRONTEND_URL })` — jamais de wildcard en prod
- **bcrypt** : cost factor ≥ 12
- **JWT** : expiration 1h, vérification stricte
- **MFA** : fenêtre TOTP ±1 step seulement
- **Messages d'erreur génériques** sur auth : "Identifiants invalides" — pas de distinction email/password
- **Prisma** : requêtes paramétrées par défaut (pas d'injection SQL)
- **Pino** : logger toutes les tentatives auth (succès et échecs)

### 1.6 `back/.env.example`
```env
JWT_SECRET=           # min 32 caractères aléatoires
DATABASE_URL=
FRONTEND_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
ADMIN_EMAIL=
```

---

## Phase 2 — Tests Backend (Jest + Supertest)

**`back/src/__tests__/`**

```
unit/
├── middleware/
│   ├── authMiddleware.test.ts         # JWT valide → pass, expiré → 401, absent → 401
│   ├── ipBanMiddleware.test.ts        # IP bannie → 403, expirée → pass
│   └── loginAttemptMiddleware.test.ts # 3e échec → ban créé, alert
└── validation/
    ├── showSchema.test.ts             # label vide, date invalide, venueId négatif
    └── venueSchema.test.ts            # name vide, city vide
integration/
├── auth.test.ts      # register dupliqué, login générique, MFA flow
├── mfa.test.ts       # setup sans auth, verify code invalide/valide
├── shows.test.ts     # GET public, POST sans auth → 401, avec auth → 201
└── venues.test.ts    # GET public, POST sans auth → 401, avec auth → 201
```

**Tests de sécurité spécifiques :**
- 4e tentative login → 429 ou 403
- Email "admin@..." → bloqué par adminTrapMiddleware
- Token expiré → 401 (pas 403)
- IP bannie → 403 même avec token valide

---

## Phase 3 — Frontend Vue 3 SPA (`front_vue/`)

Remplacer le contenu Nuxt+Vuetify par une SPA Vue 3 pure.

**Stack :** Vite + Vue 3 + TypeScript + Vue Router 4 + Pinia + Vuetify 3

**`front_vue/package.json`** :
```json
{ "name": "@portfolio/front-vue", "dependencies": { "@portfolio/shared": "workspace:*" } }
```

### 3.1 Structure
```
front_vue/src/
├── services/
│   ├── api.ts           # fetch wrapper + header auth + intercepteur 401
│   ├── venueService.ts  # getAll() → Venue[], create() → Venue
│   ├── showService.ts   # getAll() → Show[], create() → Show
│   └── authService.ts   # login(), verifyMfa(), logout()
├── stores/
│   ├── authStore.ts     # token (sessionStorage), isAuthenticated, login, logout
│   ├── venueStore.ts    # venues[], load(), create()
│   └── showStore.ts     # shows[], load(), create()
├── views/
│   ├── HomeView.vue
│   ├── ShowsView.vue
│   ├── LoginView.vue        # 2 étapes : credentials → MFA code
│   └── backoffice/
│       ├── VenuesView.vue
│       └── ShowsView.vue
├── components/
│   ├── layout/
│   │   ├── PublicLayout.vue
│   │   └── AdminLayout.vue
│   └── backoffice/
│       ├── VenueForm.vue
│       └── ShowForm.vue
├── router/index.ts      # guard /backoffice/* → redirect /login
└── plugins/vuetify.ts
```

**Imports depuis shared :**
```typescript
import { Show, Venue } from '@portfolio/shared'
```

### 3.2 Sécurité frontend
- **JWT en `sessionStorage`** (pas `localStorage`) — perdu à la fermeture de l'onglet
- **Intercepteur 401** : logout automatique + redirect `/login`
- **Route guards** : toute route `/backoffice/*` vérifie `authStore.isAuthenticated`

---

## Phase 4 — Tests Frontend (Vitest + Playwright)

**`front_vue/package.json`** : `vitest`, `@vue/test-utils`, `@vitest/coverage-v8`, `@playwright/test`

### Tests unitaires (Vitest)
```
src/__tests__/
├── services/
│   ├── venueService.test.ts   # mock fetch, vérifie retour en instances Venue
│   └── showService.test.ts    # mock fetch, vérifie retour en instances Show
└── stores/
    └── authStore.test.ts      # login, logout, isAuthenticated, sessionStorage
```

**Note :** les tests des classes (Venue, Show) sont dans `packages/shared/src/__tests__/` — un seul jeu de tests pour tous les frontends.

### Tests du package shared (Vitest)
```
packages/shared/src/__tests__/
├── Venue.test.ts   # getFullAddress() complet, champs manquants, constructeur
└── Show.test.ts    # getFormattedDate() format fr-FR, date = Date, venue = Venue
```

### Tests de composants
- `VenueForm` : submit sans nom → erreur visible, submit valide → emit
- `LoginView` : step MFA s'affiche après `mfaRequired: true`
- Route guard : `/backoffice/venues` sans token → redirect `/login`

### Tests E2E (Playwright)
```
front_vue/e2e/
├── auth.spec.ts        # login complet avec MFA → accès backoffice, logout
├── shows.spec.ts       # page publique accessible sans auth
└── backoffice.spec.ts  # créer venue, créer show, vérifier listing
```

---

## Ordre d'exécution

1. Créer `pnpm-workspace.yaml` et `package.json` racine
2. Créer `packages/shared/` avec les classes + tests
3. Cherry-pick fichiers auth depuis `origin/feature/mfa`
4. `pnpm install` deps backend
5. Mettre à jour `prisma/schema.prisma` + `npx prisma migrate dev`
6. Mettre à jour `back/src/index.ts` (routes `/api`, protection POST, CORS strict)
7. Écrire tests backend → `pnpm test:back` au vert
8. Init `front_vue/` (Vite create, Vuetify, Vue Router, Pinia)
9. Ajouter `@portfolio/shared` comme dépendance workspace
10. Créer services → stores → views → router
11. Écrire tests Vitest → E2E Playwright

---

## Vérification finale

```bash
pnpm test                                              # tous les tests au vert (shared, back, vue)
curl http://localhost:3000/api/shows                   # 200 public
curl -X POST http://localhost:3000/api/venues \
  -H "Content-Type: application/json" \
  -d '{"name":"x","city":"Paris"}'                    # 401 Unauthorized
# flow complet : register → login → MFA setup → MFA verify → POST venue/show avec token → 201
pnpm --filter @portfolio/front-vue dev                 # 5 pages opérationnelles
npx playwright test                                    # auth + backoffice E2E passent
```
