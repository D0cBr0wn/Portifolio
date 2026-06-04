# Backlog — CRUD edit/delete + MFA setup + Register + corrections UI

> À copier dans `.claude/plans/` à la racine du projet (aux côtés du premier plan).

## Contexte

Suite du premier plan (auth/MFA backend déjà livré). Ce backlog couvre :
- CRUD complet (édition + suppression) lieux et concerts dans le backoffice Vue
- Champ `details` optionnel + `label` optionnel sur les concerts
- Fix du bug MFA login (route `/mfa/verify` requiert un JWT inexistant lors du 2e step)
- Page de setup MFA (QR code) dans le backoffice
- Page Register publique (démo uniquement, clairement indiquée)
- Correction bug select lieu affiché "0" au lieu de "Choisir un lieu"
- Remplacement "Auboulot" → "Portfolio" dans l'UI

**Règle :** chaque ticket inclut ses tests (back et/ou front). Les tests doivent passer avant de pousser la PR.

Branche de départ : `dev` — chaque ticket = branche `feature/<slug>` + PR vers `dev`.

---

## T-01 — Fondations : shared + schéma DB + Zod  *(~1h)*

**Fichiers :**
- `packages/shared/src/types/api.ts`
- `packages/shared/src/models/Show.ts`
- `back/prisma/schema.prisma`
- `back/src/schemas/show.schema.ts`

**Changements :**
- `ShowData` : `label: string` → `label?: string`, ajouter `details?: string`
- `Show` class : idem + `this.details = data.details`
- `schema.prisma` model Show : `label String?`, ajouter `details String?`
- `showSchema` Zod : `label: z.string().min(1).optional()`, ajouter `details: z.string().optional()`
- Migration dans le container :
  ```bash
  docker-compose exec -T api npx prisma migrate dev --name "show_label_optional_add_details"
  ```

**Tests à mettre à jour / ajouter :**
- `packages/shared/src/__tests__/Show.test.ts` : tester `label` absent + `details` présent
- `back/src/__tests__/unit/validation/showSchema.test.ts` : `'rejette un label absent'` → doit désormais être accepté ; ajouter cas `details` optionnel
- `cd back && npm test` + `pnpm build:shared && cd packages/shared && pnpm test`

---

## T-02 — Backend : PUT + DELETE concerts  *(~1h)*

**Fichier :** `back/src/routes/show.ts`

- Supprimer la définition inline de `showSchema`, importer depuis `'../schemas/show.schema'`
- Inclure `details` dans `prisma.show.create()`
- `PUT /:id` (authentifié) : `showSchema.partial().parse()` + `prisma.show.update()`, P2025 → 404
- `DELETE /:id` (authentifié) : `prisma.show.delete()`, P2025 → 404

**Tests à mettre à jour / ajouter :**
- `back/src/__tests__/integration/shows.test.ts` : ajouter `update: jest.fn(), delete: jest.fn()` au mock Prisma ; ajouter tests PUT 200, PUT 404, DELETE 204, DELETE 404
- `cd back && npm test`

---

## T-03 — Backend : PUT + DELETE lieux  *(~1h)*

**Fichier :** `back/src/routes/venue.ts`

- Importer `venueSchema` depuis `'../schemas/venue.schema'`
- `PUT /:id` (authentifié) : `venueSchema.partial().parse()` + `prisma.venue.update()`, P2025 → 404
- `DELETE /:id` (authentifié) :
  - P2003 → 409 : *"Ce lieu est associé à des concerts et ne peut pas être supprimé."*
  - P2025 → 404

**Tests à mettre à jour / ajouter :**
- `back/src/__tests__/integration/venues.test.ts` : ajouter `update/delete` au mock ; tester PUT 200, PUT 404, DELETE 204, DELETE 409 (P2003), DELETE 404
- `cd back && npm test`

---

## T-04 — Backend : fix MFA login  *(~1h)*

**Fichier :** `back/src/routes/mfa.ts`

**Problème :** `/mfa/verify` a `authenticateToken` mais lors du 2e step du login l'utilisateur n'a pas encore de JWT → 401 systématique.

**Fix :** ajouter `POST /mfa/login` sans middleware d'auth, qui prend `{ userId, token }` depuis le body, vérifie le TOTP et retourne le JWT final. La route `/mfa/verify` (avec auth) reste pour la confirmation de setup.

**Tests à mettre à jour / ajouter :**
- `back/src/__tests__/integration/mfa.test.ts` : ajouter tests pour `POST /mfa/login` (code valide → 200 + token, code invalide → 401, userId inexistant → 400)
- `cd back && npm test`

---

## T-05 — Frontend services  *(~1h)*

**Fichiers :** `api.ts`, `authService.ts`, `venueService.ts`, `showService.ts`

- `api.ts` : ajouter `put<T>()` et `delete<T>()` ; corriger cas 204 dans `request<T>` :
  ```ts
  if (res.status === 204) return undefined as T
  ```
- `authService.ts` : `verifyMfa()` → `/mfa/login` ; ajouter `setupMfa()` → `POST /api/mfa/setup`
- `venueService.ts` + `showService.ts` : ajouter `update(id, payload)` et `remove(id)`

**Tests à mettre à jour / ajouter :**
- `front_vue/src/__tests__/services/venueService.test.ts` : ajouter `put: vi.fn(), delete: vi.fn()` au mock api ; tester `update()` et `remove()`
- `front_vue/src/__tests__/services/showService.test.ts` : idem
- `cd front_vue && pnpm test`

---

## T-06 — Frontend stores venue + show  *(~1h)*

**Fichiers :** `venueStore.ts`, `showStore.ts`

Ajouter `update` et `remove` en suivant **exactement** le pattern `loading/error/finally` existant :
- `update` : remplace l'élément dans le tableau par index
- `remove` : filtre l'élément hors du tableau

**Tests à mettre à jour / ajouter :**
- Créer `front_vue/src/__tests__/stores/venueStore.test.ts` (si inexistant) : tester `update` (liste mise à jour) et `remove` (élément retiré) ; mocker `venueService`
- Idem `showStore.test.ts`
- `cd front_vue && pnpm test`

---

## T-07 — Frontend : formulaires en mode édition  *(~2h)*

**Fichiers :** `VenueForm.vue`, `ShowForm.vue`

**VenueForm :**
- Prop `initial?: Venue` ; `onMounted` pré-remplit le formulaire
- Titre dynamique : `{{ initial ? 'Modifier le lieu' : 'Nouveau lieu' }}`
- Ne pas resetter en mode édition

**ShowForm :**
1. Bug select "0" : `venueId: 0` → `null`, rule `v > 0` → `v !== null`, `placeholder="Choisir un lieu"`
2. `label` optionnel : supprimer la règle `required`
3. Nouveau champ `details` : `<v-textarea>` optionnel
4. Prop `initial?: Show` : pré-remplir (convertir `Date` → `datetime-local`), titre dynamique

**Tests à mettre à jour / ajouter :**
- `front_vue/src/__tests__/components/VenueForm.test.ts` : tester pré-remplissage avec `initial`, titre dynamique, emit en mode édition
- Créer `front_vue/src/__tests__/components/ShowForm.test.ts` : tester `venueId` null par défaut, `label` non requis, emit avec `details`
- `cd front_vue && pnpm test`

---

## T-08 — Frontend : CRUD lieux backoffice  *(~2h)*

**Fichier :** `front_vue/src/views/backoffice/VenuesView.vue`

- Colonne `{ title: '', key: 'actions', sortable: false }` dans `headers`
- Slot `#item.actions` : icônes crayon + corbeille
- Dialog édition : `<VenueForm :initial="editingVenue" .../>`
- Dialog suppression : confirmation avec nom du lieu ; afficher l'erreur 409

**Tests à mettre à jour / ajouter :**
- Ajouter cas dans `front_vue/e2e/backoffice.spec.ts` (ou créer) : tester qu'un lieu peut être édité et supprimé via l'UI
- `cd front_vue && pnpm test:e2e` (si le serveur tourne)

---

## T-09 — Frontend : CRUD concerts backoffice  *(~2h)*

**Fichier :** `front_vue/src/views/backoffice/ShowsView.vue`

Même pattern que T-08. Dialog édition : `:initial="editingShow"` + `:venues="venueStore.venues"`.

**Tests à mettre à jour / ajouter :**
- Ajouter cas dans `front_vue/e2e/backoffice.spec.ts` : tester édition et suppression d'un concert
- `cd front_vue && pnpm test:e2e`

---

## T-10 — Frontend : page MFA setup  *(~2h)*

**Fichiers :** `MfaSetupView.vue` *(nouveau)*, `AdminLayout.vue`

Flow :
1. Bouton "Activer le MFA" → `POST /api/mfa/setup` → afficher `<img :src="qrCodeDataURL">`
2. `v-otp-input` 6 chiffres + "Confirmer" → `POST /api/mfa/verify` (avec token Bearer)
3. Succès : alerte verte "MFA activé !" + retour backoffice

`AdminLayout.vue` : ajouter lien "Sécurité MFA" dans le drawer.

**Tests à mettre à jour / ajouter :**
- Créer `front_vue/src/__tests__/components/MfaSetupView.test.ts` : tester l'affichage du QR après appel setup, le bouton confirmer désactivé si code < 6 chiffres
- `cd front_vue && pnpm test`

---

## T-11 — Frontend : page Register démo  *(~1h)*

**Fichiers :** `RegisterView.vue` *(nouveau)*, `LoginView.vue`, `router/index.ts`

**RegisterView :**
- `v-alert` type `warning` : *"Cette page est disponible uniquement pour la démonstration. Elle n'existe pas en production."*
- Formulaire : email + mot de passe + confirmation
- `POST /api/auth/register` → succès : confirmation + lien `/login`

**LoginView :** lien discret en bas : *"Créer un compte (démo)"* → `/register`

**Router :**
```ts
{ path: '/register', component: RegisterView }
{ path: '/backoffice/mfa-setup', component: MfaSetupView, meta: { requiresAuth: true } }
```

**Tests à mettre à jour / ajouter :**
- Créer `front_vue/src/__tests__/components/RegisterView.test.ts` : tester présence du bandeau démo, validation du formulaire, appel service register
- `cd front_vue && pnpm test`

---

## T-12 — Titres "Auboulot" → "Portfolio"  *(~30min)*

| Fichier | Contenu actuel |
|---|---|
| `front_vue/index.html:7` | `<title>Auboulot</title>` |
| `AdminLayout.vue:4` | `Auboulot — Backoffice` |
| `HomeView.vue:4` | `<h1>Auboulot</h1>` |
| `PublicLayout.vue:5` | `alt="Auboulot"` |
| `PublicLayout.vue:16` | `© ... Auboulot` |

⚠️ `back/src/routes/mfa.ts` ligne 15 : nom émetteur TOTP → **ne pas modifier**.

**Tests à mettre à jour / ajouter :**
- `front_vue/e2e/shows.spec.ts:66` : `'Auboulot'` → `'Portfolio'`
- `cd front_vue && pnpm test:e2e`

---

## Récapitulatif

| Ticket | Sujet | Durée |
|---|---|---|
| T-01 | Fondations shared + schéma + Zod | ~1h |
| T-02 | Backend PUT/DELETE concerts | ~1h |
| T-03 | Backend PUT/DELETE lieux | ~1h |
| T-04 | Backend fix MFA login | ~1h |
| T-05 | Frontend services | ~1h |
| T-06 | Frontend stores | ~1h |
| T-07 | Frontend formulaires édition | ~2h |
| T-08 | Frontend CRUD lieux backoffice | ~2h |
| T-09 | Frontend CRUD concerts backoffice | ~2h |
| T-10 | Frontend page MFA setup | ~2h |
| T-11 | Frontend page Register démo | ~1h |
| T-12 | Titres Portfolio | ~30min |
| **Total** | | **~16h30** |
