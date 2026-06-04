# Plan — User CRUD + MFA management + createdBy sur Show/Venue

## Context

L'app n'a pas encore de gestion des utilisateurs exposée via API. Le CRUD auth existe (register/login) mais il n'y a pas de routes pour lister, modifier ou supprimer des utilisateurs. De plus, il n'y a pas de notion de rôle (admin/user), pas de traçabilité sur qui a créé un show ou un venue, et aucune interface backoffice pour exposer ces informations aux admins.

Objectif : ajouter un CRUD utilisateurs sécurisé avec gestion MFA via l'API, un système de rôles minimal, la traçabilité du créateur sur Show et Venue (visible uniquement en backoffice), et la couverture de tests complète.

---

## 1. Changements Prisma schema

**Fichier :** `back/prisma/schema.prisma`

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String
  role      Role      @default(USER)        // nouveau
  mfaSecret String?
  banUntil  DateTime?
  createdAt DateTime  @default(now())       // nouveau
  updatedAt DateTime  @updatedAt            // nouveau
  shows     Show[]    @relation("ShowCreator")   // nouveau
  venues    Venue[]   @relation("VenueCreator")  // nouveau
}

model Show {
  id          Int      @id @default(autoincrement())
  label       String
  date        DateTime
  venueId     Int
  venue       Venue    @relation(fields: [venueId], references: [id])
  createdById Int?                                                      // nouveau
  createdBy   User?    @relation("ShowCreator", fields: [createdById], references: [id])
  createdAt   DateTime @default(now())      // nouveau
  updatedAt   DateTime @updatedAt           // nouveau
}

model Venue {
  id          Int      @id @default(autoincrement())
  name        String
  city        String
  address1    String?
  address2    String?
  zipCode     String?
  shows       Show[]
  createdById Int?                                                       // nouveau
  createdBy   User?    @relation("VenueCreator", fields: [createdById], references: [id])
  createdAt   DateTime @default(now())      // nouveau
  updatedAt   DateTime @updatedAt           // nouveau
}
```

Migration : `npx prisma migrate dev --name add_role_createdby_timestamps`

`createdById` est nullable → les lignes existantes auront `null`, aucune migration de données nécessaire.

---

## 2. Nouveaux fichiers à créer

### Backend

| Fichier | Rôle |
|---|---|
| `back/src/middleware/requireAdmin.ts` | Vérifie `req.user.role === 'ADMIN'`, retourne 403 sinon |
| `back/src/middleware/requireSelfOrAdmin.ts` | Vérifie `req.params.id === req.user.userId` OU role ADMIN, retourne 403 sinon |
| `back/src/schemas/user.schema.ts` | Zod : `updateUserSchema` (email? + password?, au moins 1 champ) |
| `back/src/routes/users.ts` | CRUD utilisateurs + sous-routes MFA |
| `back/src/routes/backoffice.ts` | Routes admin-only : GET shows + venues avec createdBy |

### Tests

| Fichier | Ce qu'il teste |
|---|---|
| `back/src/__tests__/unit/middleware/requireAdmin.test.ts` | next() si ADMIN, 403 si USER, 403 si non authentifié |
| `back/src/__tests__/unit/middleware/requireSelfOrAdmin.test.ts` | next() si self, next() si ADMIN, 403 sinon, 400 si id non numérique |
| `back/src/__tests__/unit/validation/userSchema.test.ts` | email seul, password seul, les deux, objet vide refusé, email invalide |
| `back/src/__tests__/integration/users.test.ts` | Tous les endpoints CRUD + MFA sub-routes |
| `back/src/__tests__/integration/backoffice.test.ts` | GET /backoffice/shows et GET /backoffice/venues avec createdBy |

### Frontend

| Fichier | Rôle |
|---|---|
| `front_vue/src/services/backofficeService.ts` | Appelle `/api/backoffice/shows` et `/api/backoffice/venues` |

### Types partagés

Ajouter dans `packages/shared/src/types/api.ts` :
```typescript
export interface ShowWithCreator extends ShowData {
  createdBy: { email: string } | null
}
export interface VenueWithCreator extends VenueData {
  createdBy: { email: string } | null
}
```

---

## 3. Fichiers à modifier

### `back/src/types/express/index.d.ts`
Ajouter `role` au payload JWT :
```typescript
export interface JwtUserPayload {
  userId: number
  email: string
  role: 'USER' | 'ADMIN'   // nouveau
}
```

### `back/src/routes/auth.ts`
- `POST /register` : compter les users existants (`prisma.user.count()`) avant `create` → si `count === 0` : `role: 'ADMIN'`, sinon `role: 'USER'`
- `POST /login` : ajouter `role: user.role` dans `jwt.sign()`

### `back/src/routes/mfa.ts`
- `POST /verify` : ajouter `role: user.role` dans `jwt.sign()` (l. 55)

### `back/src/routes/show.ts`
- `POST /` : ajouter `createdById: req.user!.userId` dans `prisma.show.create({ data: ... })`
- `GET /` : inchangé (pas de `createdBy` dans la réponse publique)

### `back/src/routes/venue.ts`
- `POST /` : même pattern que show

### `back/src/index.ts`
```typescript
import userRoutes from './routes/users'
import backofficeRoutes from './routes/backoffice'
app.use('/api/users', userRoutes)
app.use('/api/backoffice', backofficeRoutes)
```

### `back/src/__tests__/helpers/testApp.ts`
Ajouter les 2 nouveaux routeurs.

### Tests existants à mettre à jour
- `auth.test.ts` + `mfa.test.ts` : ajouter `role: 'USER'` aux mocks user + assertions sur le JWT
- `shows.test.ts` + `venues.test.ts` : ajouter `role: 'USER'` dans les `jwt.sign()` de test + assertion `createdById`

### Frontend

**`front_vue/src/stores/showStore.ts`** — ajouter `loadBackoffice()` qui appelle `backofficeService.getShows()`

**`front_vue/src/stores/venueStore.ts`** — même pattern

**`front_vue/src/views/backoffice/ShowsView.vue`** — utiliser `loadBackoffice()`, ajouter colonne `createdBy`

**`front_vue/src/views/backoffice/VenuesView.vue`** — même pattern

**`front_vue/src/stores/authStore.ts`** — ajouter computed `isAdmin` en décodant le JWT :
```typescript
const isAdmin = computed(() => {
  if (!token.value) return false
  try {
    return JSON.parse(atob(token.value.split('.')[1])).role === 'ADMIN'
  } catch { return false }
})
```

---

## 4. Détail des routes `/api/users`

| Méthode | Path | Auth | Réponse |
|---|---|---|---|
| GET | `/` | ADMIN | Liste users : `{ id, email, role, mfaEnabled: !!mfaSecret, createdAt }` — sans password ni mfaSecret |
| GET | `/:id` | self ou ADMIN | Même shape que ci-dessus |
| PUT | `/:id` | self ou ADMIN | Met à jour email et/ou password (bcrypt si password) |
| DELETE | `/:id` | ADMIN | 204 No Content |
| GET | `/:id/mfa` | self ou ADMIN | `{ enabled: boolean }` |
| DELETE | `/:id/mfa` | self ou ADMIN | Nullifie `mfaSecret`, retourne 200 |

---

## 5. Vérification

```bash
# Backend — dans back/
npm test                    # tous les tests, coverage ≥ 70%
npx tsc --noEmit            # vérification TypeScript

# Docker
docker-compose up --build
docker-compose exec api npx prisma migrate dev

# Frontend — dans front_vue/
npm run dev                 # vérifier les vues backoffice ShowsView + VenuesView
```

Vérifier manuellement :
- `GET /api/shows` ne contient pas `createdBy`
- `GET /api/backoffice/shows` avec token ADMIN contient `createdBy: { email }`
- `GET /api/backoffice/shows` sans token → 401, avec token USER → 403

---

## Backlog — tâches de 1 à 3 heures (ordre d'implémentation)

### T1 — Prisma schema : rôles, createdBy, timestamps `[1.5h]`
Modifier `prisma/schema.prisma` (voir §1) et lancer la migration.
**Fichiers :** `prisma/schema.prisma`

### T2 — Typage JWT : ajouter `role` `[0.5h]`
Mettre à jour `JwtUserPayload` et corriger les `jwt.sign()` dans `auth.ts` et `mfa.ts` pour inclure `role`. Premier user inscrit = ADMIN.
**Fichiers :** `src/types/express/index.d.ts`, `src/routes/auth.ts`, `src/routes/mfa.ts`

### T3 — Mise à jour des tests auth/mfa existants `[1h]`
Ajouter `role` aux mocks et assertions dans `auth.test.ts` et `mfa.test.ts` pour qu'ils repassent au vert.
**Fichiers :** `src/__tests__/integration/auth.test.ts`, `mfa.test.ts`

### T4 — Middleware `requireAdmin` + `requireSelfOrAdmin` `[1h]`
Créer les deux middlewares. Écrire leurs tests unitaires.
**Fichiers :** `src/middleware/requireAdmin.ts`, `requireSelfOrAdmin.ts`, tests unitaires associés

### T5 — Zod schema + tests unitaires utilisateur `[1h]`
Créer `src/schemas/user.schema.ts` avec `updateUserSchema`. Écrire `userSchema.test.ts`.
**Fichiers :** `src/schemas/user.schema.ts`, test unitaire

### T6 — Routes CRUD `/api/users` `[2h]`
Créer `src/routes/users.ts` avec les 6 endpoints (voir §4). Monter dans `index.ts` et `testApp.ts`.
**Fichiers :** `src/routes/users.ts`, `src/index.ts`, `src/__tests__/helpers/testApp.ts`

### T7 — Tests d'intégration `/api/users` `[2.5h]`
Couvrir tous les cas : admin-only, self-only, 404, 403, update password hashé, MFA reset.
**Fichier :** `src/__tests__/integration/users.test.ts`

### T8 — `createdBy` sur Show et Venue `[1h]`
Modifier `POST /shows` et `POST /venues` pour passer `createdById: req.user!.userId`. Mettre à jour les tests `shows.test.ts` et `venues.test.ts` (ajout `role` dans les tokens + assertion `createdById`).
**Fichiers :** `src/routes/show.ts`, `src/routes/venue.ts`, tests existants

### T9 — Routes backoffice `[1.5h]`
Créer `src/routes/backoffice.ts` : `GET /shows` et `GET /venues` avec `include: { createdBy: { select: { email: true } } }`, protégés par `authenticateToken + requireAdmin`. Monter dans `index.ts` et `testApp.ts`.
**Fichiers :** `src/routes/backoffice.ts`, `src/index.ts`, `testApp.ts`

### T10 — Tests d'intégration backoffice `[1.5h]`
Tester : 401 sans token, 403 avec USER, 200 avec ADMIN + shape de réponse avec `createdBy`.
**Fichier :** `src/__tests__/integration/backoffice.test.ts`

### T11 — Types partagés + service backoffice frontend `[1h]`
Ajouter `ShowWithCreator` / `VenueWithCreator` dans `packages/shared/src/types/api.ts`. Créer `front_vue/src/services/backofficeService.ts`.
**Fichiers :** `packages/shared/src/types/api.ts`, `front_vue/src/services/backofficeService.ts`

### T12 — Vue backoffice : colonne createdBy `[1.5h]`
Ajouter `loadBackoffice()` dans les stores show/venue. Mettre à jour `ShowsView.vue` et `VenuesView.vue` pour appeler les routes backoffice et afficher la colonne `createdBy`. Ajouter `isAdmin` dans `authStore.ts`.
**Fichiers :** `front_vue/src/stores/showStore.ts`, `venueStore.ts`, `authStore.ts`, `views/backoffice/ShowsView.vue`, `VenuesView.vue`
