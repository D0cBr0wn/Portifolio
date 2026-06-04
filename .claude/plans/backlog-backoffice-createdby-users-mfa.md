# Backlog — Backoffice front : createdBy, gestion users, MFA admin

> ⚠️ Créer ce fichier dans `Portifolio/.claude/plans/` (CLAUDE.md l.42 : jamais dans `~/.claude/plans/`).
> Déplacer les plans existants de `~/.claude/plans/` vers le projet lors de l'implémentation.

## Context

Le backoffice Vue manque de trois groupes de fonctionnalités :
1. Les vues Lieux et Concerts n'affichent pas qui a créé un élément ni quand (les routes `/api/backoffice/*` qui retournent ces données existent déjà).
2. La page Users liste et supprime, mais ne permet pas de modifier le rôle ni le mot de passe d'un utilisateur.
3. L'admin ne peut pas forcer l'activation du MFA pour un utilisateur. Quand MFA est imposé, le flow de login doit guider l'user vers la configuration de son authenticator.

---

## État existant pertinent

| Ce qui existe | Fichier |
|---|---|
| `GET /api/backoffice/shows` → `createdBy + createdAt` | `back/src/routes/backoffice.ts` |
| `GET /api/backoffice/venues` → `createdBy + createdAt` | idem |
| `PUT /api/users/:id` → email + password (Zod) | `back/src/routes/users.ts` |
| `DELETE /api/users/:id/mfa` → nullifie mfaSecret | idem |
| `POST /api/mfa/setup` → génère QR (JWT requis) | `back/src/routes/mfa.ts` |
| `POST /api/mfa/verify` → vérifie TOTP, retourne JWT final | idem |
| `UserData` type, `isAdmin` computed, `userService`, `userStore` | `packages/shared`, `front_vue/src/` |

---

## Backlog — 7 tickets (ordre d'implémentation)

---

### T-f1 — Colonnes createdBy + createdAt dans ShowsView et VenuesView (~1.5h)

**Aucun changement backend** — routes admin existent déjà.

**Shared** (`packages/shared/src/types/api.ts` + `index.ts`) :
```typescript
export interface ShowWithCreator extends ShowData {
  createdBy: { email: string } | null
  createdAt: string
}
export interface VenueWithCreator extends VenueData {
  createdBy: { email: string } | null
  createdAt: string
}
```

**Service** — créer `front_vue/src/services/backofficeService.ts` :
```typescript
getShows(): api.get<ShowWithCreator[]>('/backoffice/shows')
getVenues(): api.get<VenueWithCreator[]>('/backoffice/venues')
```

**Stores** — ajouter dans `showStore.ts` et `venueStore.ts` :
```typescript
const backofficeItems = ref<ShowWithCreator[] | VenueWithCreator[]>([])
async function loadBackoffice() { ... }  // même pattern load/error/finally
```

**Vues** — modifier `ShowsView.vue` et `VenuesView.vue` :
- Appeler `loadBackoffice()` au montage (en plus de `load()` pour les formulaires)
- Alimenter la table avec `backofficeItems` au lieu de `shows`/`venues`
- Ajouter headers :
  ```
  { title: 'Créé par', key: 'createdBy', sortable: false }
  { title: 'Créé le', key: 'createdAt', sortable: true }
  ```
- Slots template : `createdBy?.email || '—'` et date formatée

**Tests** :
- `front_vue/src/__tests__/services/backofficeService.test.ts` : mock api, vérifier `getShows()` et `getVenues()` appellent les bons endpoints
- `front_vue/src/__tests__/stores/showStore.test.ts` et `venueStore.test.ts` : ajouter cas `loadBackoffice()` (state mis à jour, erreur capturée)

---

### T-b1 — Backend : Prisma champ `mfaRequired` + migration (~0.5h)

**Fichier** `back/prisma/schema.prisma` — ajouter sur `User` :
```prisma
mfaRequired Boolean @default(false)
```

Migration : `npx prisma migrate dev --name "add_user_mfa_required"`  
Client : regénéré automatiquement.

**Tests** : aucun test applicatif — vérification via `npx tsc --noEmit` + migration propre.

---

### T-b2 — Backend : PATCH /api/users/:id/role (~1h)

**Fichier** `back/src/routes/users.ts` :
- Nouveau endpoint `PATCH /:id/role` — admin-only (`requireAdmin`)
- Zod inline : `z.object({ role: z.enum(['USER', 'ADMIN']) })`
- `prisma.user.update({ where: { id }, data: { role } })`
- Réponse : user mis à jour (même shape que GET)
**Tests** — `back/src/__tests__/integration/users.test.ts` (étendre le fichier existant) :
- `PATCH /api/users/:id/role` : 200 + role mis à jour si ADMIN, 403 si USER, 400 si role invalide, 404 P2025

---

### T-b3 — Backend : POST /api/users/:id/mfa/require (~1h)

**Fichier** `back/src/routes/users.ts` :
- Nouveau endpoint `POST /:id/mfa/require` — admin-only
- Logique : `prisma.user.update({ data: { mfaRequired: true, mfaSecret: null } })`
  - Réinitialise `mfaSecret` pour forcer un nouveau scan QR
- Réponse : `{ message: 'MFA requis pour cet utilisateur' }` 200
**Tests** — `back/src/__tests__/integration/users.test.ts` (étendre) :
- `POST /api/users/:id/mfa/require` : 200 si ADMIN, 403 si USER, 404 si user inexistant
- Vérifier que le mock `prisma.user.update` est appelé avec `{ mfaRequired: true, mfaSecret: null }`

---

### T-b4 — Backend : flow login → mfaSetupRequired (~2h)

**Problème** : si `mfaRequired && !mfaSecret`, l'user n'a pas encore de secret TOTP. Il ne peut pas appeler `/mfa/setup` sans token valide, et il n'a pas de token car il n'a pas encore de MFA.

**Solution** : émettre un `setupToken` temporaire (JWT 15 min, scope limité) lors du login.

**`back/src/types/express/index.d.ts`** :
```typescript
export interface JwtUserPayload {
  userId: number; email: string; role: 'USER' | 'ADMIN'
  scope?: 'mfa-setup'   // nouveau champ optionnel
}
```

**`back/src/routes/auth.ts`** — modifier `POST /login` :
```typescript
if (user.mfaRequired && !user.mfaSecret) {
  const setupToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, scope: 'mfa-setup' },
    process.env.JWT_SECRET!, { expiresIn: '15m' }
  )
  res.status(206).json({ mfaSetupRequired: true, userId: user.id, setupToken })
  return
}
```

**`back/src/routes/mfa.ts`** :
- `POST /setup` : déjà protégé par `authenticateToken` — le `setupToken` est un JWT valide, donc ça fonctionne sans changement.
- `POST /verify` : après vérification TOTP réussie, si `req.user.scope === 'mfa-setup'` → mettre à jour `mfaRequired: false` avant d'émettre le JWT final.

**Tests** :
- `back/src/__tests__/integration/auth.test.ts` : nouveau cas `POST /auth/login` avec user `mfaRequired: true, mfaSecret: null` → 206 + `mfaSetupRequired: true` + `setupToken` valide (décodable avec scope `mfa-setup`)
- `back/src/__tests__/integration/mfa.test.ts` : `POST /mfa/verify` avec token scope `mfa-setup` → 200 + JWT final + `mfaRequired` mis à jour à `false`

---

### T-f2 — Frontend : UserDetailView — rôle + mot de passe (~2h)

**Route** : `/backoffice/users/:id` (meta: requiresAuth + requiresAdmin)

**Service** — compléter `front_vue/src/services/userService.ts` :
```typescript
getById(id): GET /api/users/:id → UserData
updateRole(id, role): PATCH /api/users/:id/role
updatePassword(id, password): PUT /api/users/:id { password }
```

**Store** — compléter `front_vue/src/stores/userStore.ts` :
- `currentUser: ref<UserData | null>(null)`
- `loadUser(id)`, `updateRole(id, role)`, `updatePassword(id, password)`
- Met à jour aussi `users[]` si l'user modifié est dedans

**UsersView.vue** : rendre chaque ligne cliquable → `router.push('/backoffice/users/' + item.id)`

**UserDetailView.vue** (nouveau) :
- Section infos : email, rôle (chip), MFA, date d'inscription
- Section rôle : `<v-select>` USER/ADMIN + bouton "Enregistrer" → `store.updateRole()`
- Section password : `<v-text-field type="password">` + bouton "Modifier" → `store.updatePassword()`
- Bouton retour → `/backoffice/users`

**Tests** :
- `front_vue/src/__tests__/services/userService.test.ts` : ajouter `getById`, `updateRole`, `updatePassword` (mock api.get/patch/put, vérifier paths et payloads)
- `front_vue/src/__tests__/stores/userStore.test.ts` : `loadUser`, `updateRole`, `updatePassword` — vérifier que `currentUser` et `users[]` sont mis à jour

---

### T-f3 — Frontend : MFA admin — activer/désactiver + flow login setup (~3h)

**Service** — compléter `userService.ts` :
```typescript
requireMfa(id): POST /api/users/:id/mfa/require
disableMfa(id): DELETE /api/users/:id/mfa
```

**Store** — compléter `userStore.ts` : méthodes `requireMfa(id)` + `disableMfa(id)`, mettent à jour `mfaEnabled` dans la liste locale.

**UsersView.vue** : icône MFA clickable (shield-check/shield-off) — un clic appelle `requireMfa` ou `disableMfa` avec confirmation.

**UserDetailView.vue** : section MFA avec bouton "Activer le MFA" ou "Désactiver le MFA" selon l'état.

**LoginView.vue** — gérer `mfaSetupRequired: true` dans la réponse auth :
1. Afficher un step "Configurer votre authentificateur"
2. Appeler `POST /api/mfa/setup` avec le `setupToken` reçu → afficher le QR code
3. Champ 6 chiffres + bouton "Confirmer" → `POST /api/mfa/verify` avec `setupToken`
4. Sur succès → `authStore.setToken(token)` → navigate `/backoffice`

**authService.ts** — ajouter `setupMfa(setupToken)` et mettre à jour `verifyMfa` pour accepter un token override.

**Tests** :
- `front_vue/src/__tests__/services/userService.test.ts` : `requireMfa` et `disableMfa` (mock api.post/delete)
- `front_vue/src/__tests__/stores/userStore.test.ts` : `requireMfa` et `disableMfa` — vérifier que `mfaEnabled` est mis à jour dans `users[]`

---

## Patterns à réutiliser

| Pattern | Fichier de référence |
|---|---|
| Store load/error/finally | `front_vue/src/stores/venueStore.ts` |
| Service api.get/put/delete | `front_vue/src/services/venueService.ts` |
| DataTable + dialog suppression | `front_vue/src/views/backoffice/VenuesView.vue` |
| Dialog confirmation | `front_vue/src/views/backoffice/VenuesView.vue` lignes 56-70 |
| isAdmin computed | `front_vue/src/stores/authStore.ts` |
| MFA setup QR | `front_vue/src/views/backoffice/MfaSetupView.vue` |

---

## Vérification end-to-end

```bash
# Backend
cd back && npm test          # tous les tests doivent passer
npx tsc --noEmit

# Shared
cd packages/shared && pnpm build

# Frontend
cd front_vue && npm run dev
```

Scénarios à tester manuellement :
- ShowsView et VenuesView affichent les colonnes "Créé par" et "Créé le" (valeur null affichée comme "—")
- ADMIN : clic sur une ligne Users → UserDetailView charge les infos
- ADMIN : modification du rôle USER→ADMIN sauvegardée + chip mis à jour
- ADMIN : modification du mot de passe → connexion réussie avec le nouveau
- ADMIN : activation MFA sur user → icône passe en shield-off (setup requis)
- USER concerné : login → 206 mfaSetupRequired → QR affiché → scan phone → code confirmé → JWT final → accès backoffice
