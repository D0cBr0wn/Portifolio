# Plan : Migration des locators E2E vers data-testid

## Context

Les tests E2E Playwright plantent parce que certains locators reposent sur des structures CSS fragiles (`.v-dialog--active`, `input[type="number"]`) ou du texte visible qui peut être renommé. L'objectif est de remplacer tous les locators structurels par des attributs `data-testid` stables, sur les 3 frontends (Vue, React, Angular).

---

## Convention de nommage des data-testid

| Élément | `data-testid` |
|---|---|
| Titre de la page login (Connexion / Vérification MFA) | `login-title` |
| Champ email | `email-input` |
| Champ password | `password-input` |
| Bouton "Se connecter" | `login-submit` |
| Texte hint MFA (Google Authenticator) | `mfa-hint` |
| Wrapper du composant OTP (Vue) / input OTP (React, Angular) | `otp-wrapper` / `otp-input` |
| Bouton "Vérifier" | `mfa-submit` |
| Message d'erreur serveur | `server-error` |
| Bouton "Déconnexion" | `logout-btn` |
| Bouton "Ajouter un lieu" | `add-venue-btn` |
| Titre du dialog venue (Nouveau lieu) | `venue-dialog-title` |
| Input nom dans VenueForm | `venue-name-input` |
| Input ville dans VenueForm | `venue-city-input` |
| Bouton "Enregistrer" dans VenueForm | `save-btn` |
| Bouton "Ajouter un concert" | `add-show-btn` |
| Titre du dialog show (Nouveau concert) | `show-dialog-title` |
| Input label dans ShowForm | `show-label-input` |
| Input date dans ShowForm | `show-date-input` |
| Titre h1 "Concerts" (page publique) | `shows-heading` |
| Titre h1 "Portfolio" (page d'accueil) | `home-heading` |
| Lien "Voir tous les concerts" | `view-all-shows` |

**Règle** : `getByText(data content)` (ex. noms de concerts/lieux mockés) reste inchangé — ce sont des assertions sur les données, pas sur la structure.

---

## Approche par framework

### Vue (Vuetify 3)
- `v-btn` : le `data-testid` s'applique directement à l'élément `<button>` → `page.getByTestId('...')`
- `v-text-field` : le `data-testid` s'applique au wrapper div → test utilise `.locator('input')` à l'intérieur (ex. `page.getByTestId('email-input').locator('input')`)
- `v-otp-input` (6 inputs) : wrapper `<div data-testid="otp-wrapper">` autour du composant → `page.getByTestId('otp-wrapper').locator('input')`
- `v-alert` : `data-testid` sur le composant → `page.getByTestId('server-error')`
- `VenueForm`/`ShowForm` : le titre `<p class="text-h6">` reçoit le testid du dialog-title

### React (MUI)
- `Button` MUI : `data-testid` comme prop s'applique à l'élément `<button>` → direct
- `TextField` MUI : utiliser `inputProps={{ 'data-testid': '...' }}` pour cibler le `<input>` natif → `page.getByTestId('...')` direct
- `Typography` pour les titres : `data-testid` comme prop → direct
- `AdminLayout` : `Button` logout reçoit `data-testid="logout-btn"`

### Angular (Angular Material)
- `<button mat-raised-button>` : `data-testid="..."` comme attribut HTML → direct
- `<input matInput>` dans mat-form-field : `data-testid="..."` directement sur l'élément `<input>` → direct
- Dialog titles `<h2>` : `data-testid="..."` directement sur le `<h2>` (le dialog étant dans l'overlay, `page.getByTestId()` le trouve quand même)
- `page.locator('[role="dialog"]')` existant → remplacé par `page.getByTestId('venue-dialog-title')` pour vérifier le contenu du dialog

---

## Fichiers à modifier par ticket

### Ticket 1 — Vue (feat/e2e-testid-vue)
**Composants** (ajout data-testid) :
- `front_vue/src/views/LoginView.vue` : `v-card-title` (login-title), email (email-input), password (password-input), Se connecter (login-submit), hint MFA (mfa-hint), OTP wrapper (otp-wrapper), Vérifier (mfa-submit), v-alert erreur (server-error)
- `front_vue/src/components/layout/AdminLayout.vue` : bouton Déconnexion (logout-btn)
- `front_vue/src/views/backoffice/VenuesView.vue` : bouton Ajouter (add-venue-btn)
- `front_vue/src/components/backoffice/VenueForm.vue` : titre `<p>` (venue-dialog-title), input nom (venue-name-input), input ville (venue-city-input), bouton Enregistrer (save-btn)
- `front_vue/src/views/backoffice/ShowsView.vue` : bouton Ajouter (add-show-btn)
- `front_vue/src/components/backoffice/ShowForm.vue` : titre `<p>` (show-dialog-title), input label (show-label-input), input date (show-date-input)
- `front_vue/src/views/ShowsView.vue` : `<h1>` (shows-heading)
- `front_vue/src/views/HomeView.vue` : `<h1>` (home-heading), v-btn lien shows (view-all-shows)

**Tests E2E** (mise à jour locators) :
- `front_vue/e2e/auth.spec.ts`
- `front_vue/e2e/backoffice.spec.ts`
- `front_vue/e2e/shows.spec.ts`

### Ticket 2 — React (feat/e2e-testid-react)
**Composants** :
- `front_react/src/pages/Login.tsx` : Typography titre (login-title), email inputProps (email-input), password inputProps (password-input), bouton submit (login-submit), OTP inputProps (otp-input), Vérifier (mfa-submit), Alert erreur (server-error), hint Google Auth (mfa-hint)
- `front_react/src/components/layout/AdminLayout.tsx` : Button Déconnexion (logout-btn)
- `front_react/src/pages/backoffice/Venues.tsx` : Button Ajouter (add-venue-btn)
- `front_react/src/components/backoffice/VenueForm.tsx` : Typography titre (venue-dialog-title), nom inputProps (venue-name-input), ville inputProps (venue-city-input), bouton Enregistrer (save-btn)
- `front_react/src/pages/backoffice/Shows.tsx` : Button Ajouter (add-show-btn)
- `front_react/src/components/backoffice/ShowForm.tsx` : Typography titre (show-dialog-title), label inputProps (show-label-input), date inputProps (show-date-input)
- `front_react/src/pages/Shows.tsx` : Typography Concerts (shows-heading)
- `front_react/src/pages/Home.tsx` : Typography Portfolio (home-heading), Button voir shows (view-all-shows)

**Tests E2E** :
- `front_react/e2e/auth.spec.ts`
- `front_react/e2e/backoffice.spec.ts`
- `front_react/e2e/shows.spec.ts`

### Ticket 3 — Angular (feat/e2e-testid-angular)
**Composants** :
- `front_angular/src/app/pages/login/login.component.ts` : `<h2>` titre (login-title), `<input email>` (email-input), `<input password>` (password-input), bouton submit (login-submit), `<p class="hint">` (mfa-hint), `<input mfaCode>` (otp-input), bouton Vérifier (mfa-submit), `<div class="error-msg">` (server-error)
- `front_angular/src/app/layout/admin/admin-layout.component.ts` : `<button mat-button>` Déconnexion (logout-btn)
- `front_angular/src/app/pages/backoffice/venues/venues.component.ts` : `<button>` Ajouter (add-venue-btn)
- `front_angular/src/app/pages/backoffice/venues/venue-form-dialog.component.ts` : `<h2>` (venue-dialog-title), `<input name="name">` (venue-name-input), `<input name="city">` (venue-city-input), bouton Enregistrer (save-btn)
- `front_angular/src/app/pages/backoffice/shows/shows.component.ts` : `<button>` Ajouter (add-show-btn)
- `front_angular/src/app/pages/backoffice/shows/show-form-dialog.component.ts` : `<h2>` (show-dialog-title), `<input name="label">` (show-label-input), `<input name="date">` (show-date-input)
- `front_angular/src/app/pages/shows/shows.component.ts` : `<h1>` (shows-heading)
- `front_angular/src/app/pages/home/home.component.ts` : `<h1>` (home-heading), `<a mat-button>` voir shows (view-all-shows)

**Tests E2E** :
- `front_angular/e2e/auth.spec.ts`
- `front_angular/e2e/backoffice.spec.ts`
- `front_angular/e2e/shows.spec.ts`

---

## Exemple de transformation de test (Vue auth.spec.ts)

```ts
// AVANT
await expect(page.getByText('Connexion')).toBeVisible()
await page.locator('input[type="email"]').fill('test@example.com')
await page.locator('input[type="password"]').fill('password123')
await page.locator('button', { hasText: 'Se connecter' }).click()

// APRÈS
await expect(page.getByTestId('login-title')).toBeVisible()
await page.getByTestId('email-input').locator('input').fill('test@example.com')
await page.getByTestId('password-input').locator('input').fill('password123')
await page.getByTestId('login-submit').click()
```

---

## Backlog

| # | Tâche | Branche | Durée | Dépendances |
|---|---|---|---|---|
| BP-1 | Composants Vue + tests E2E Vue | `feat/e2e-testid-vue` | 2h | — |
| BP-2 | Composants React + tests E2E React | `feat/e2e-testid-react` | 2h | — |
| BP-3 | Composants Angular + tests E2E Angular | `feat/e2e-testid-angular` | 2h | — |

Les 3 tickets sont **indépendants** et peuvent être faits en parallèle (branches séparées depuis `dev`).

---

## Vérification

Pour chaque ticket, lancer les tests E2E du frontend concerné :
```bash
cd front_vue   # ou front_react / front_angular
npm run dev &  # serveur dev en arrière-plan
npx playwright test
```

Les tests doivent tous passer sans utiliser `getByText` ni `locator(CSS)` pour les éléments structurels.
