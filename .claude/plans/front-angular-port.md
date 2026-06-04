# Plan — Port front_vue → front_angular

## Contexte

Le projet contient `front_vue/` (Vue 3 + Vite + Vuetify + Pinia, port 5173) et `front_react/` (React + Vite + MUI + Zustand, port 5174).
Objectif : créer `front_angular/` — mêmes fonctionnalités, même look, même back — en Angular.
Les trois fronts affichent un badge Vue / React / Angular en bas à droite pour switcher entre eux.

## Stack Angular

| Besoin | Vue | React | Angular |
|--------|-----|-------|---------|
| Build | Vite | Vite | Angular CLI 18 (esbuild) |
| UI | Vuetify 3 | MUI v6 | Angular Material 18 |
| Routing | Vue Router | React Router v7 | Angular Router (built-in) |
| State | Pinia | Zustand v5 | Angular Signals + signal-based store |
| Icons | @mdi/font | @mui/icons-material | Material Icons (font) |
| Types | @portfolio/shared | @portfolio/shared | @portfolio/shared (workspace) |
| DataGrid | v-data-table | @mui/x-data-grid | Angular Material Table (MatTableModule) |
| HTTP | fetch/axios | fetch/axios | HttpClient (built-in) |

Port Angular : **5175** (Vue = 5173, React = 5174).

## Backlog — branches à créer (stacked, T1 → T17)

| Branche | Tâche | Durée estimée |
|---------|-------|---------------|
| `feature/angular-t1-setup` | Setup projet Angular CLI + intégration pnpm workspace + port 5175 | 1-2h |
| `feature/angular-t2-theme` | Thème Angular Material (custom palette Material 3) | 1-2h |
| `feature/angular-t3-services` | Couche services HTTP (HttpClient : ShowService, VenueService, UserService, AuthService) | 2-3h |
| `feature/angular-t4-auth-routing` | Auth store (Signals) + Angular Router + guards (AuthGuard, GuestGuard) | 2-3h |
| `feature/angular-t5-public-layout` | PublicLayout (AppShell public, toolbar, footer) | 1-2h |
| `feature/angular-t6-admin-layout` | AdminLayout (sidebar nav, AppShell backoffice) | 1-2h |
| `feature/angular-t7-stores` | Stores show/venue/user (signal-based) | 2-3h |
| `feature/angular-t8-home` | Page Home | 1-2h |
| `feature/angular-t9-shows` | Page Shows (liste publique) | 1-2h |
| `feature/angular-t10-techbadge` | TechBadge Angular ajouté sur les trois fronts (Vue, React, Angular) | 1-2h |
| `feature/angular-t11-login` | Page Login (3 étapes MFA : identifiants → code TOTP → succès) | 2-3h |
| `feature/angular-t12-register` | Page Register | 1-2h |
| `feature/angular-t13-venues` | Backoffice Venues (VenueForm dialog + MatTable CRUD) | 2-3h |
| `feature/angular-t14-shows-bo` | Backoffice Shows (ShowForm dialog + MatTable CRUD) | 2-3h |
| `feature/angular-t15-mfa-setup` | Backoffice MFA Setup (QR code + activation/désactivation) | 1-2h |
| `feature/angular-t16-users` | Backoffice Users (liste + filtres) | 1-2h |
| `feature/angular-t17-user-detail` | Backoffice UserDetail (rôle, mot de passe, statut MFA) | 1-2h |

**Total estimé : ~23-40h (≈ 31h)**

## Ordre de merge

Les branches sont stacked — merger dans l'ordre T1 → T17, chacune vers `dev`.
Après merge de T1, T2 montre le delta T2 uniquement, etc.

## Notes techniques Angular

- Utiliser **standalone components** (Angular 17+) — pas de NgModules
- State management via **Signals** (`signal()`, `computed()`, `effect()`) + service injectable
- Injection via `inject()` (pas de constructeur DI explicite)
- `HttpClient` fourni via `provideHttpClient(withInterceptors([...]))` dans `app.config.ts`
- `@portfolio/shared` importé via alias `@shared` configuré dans `tsconfig.json`
- Lazy loading des routes backoffice via `loadComponent` / `loadChildren`

## Vérification end-to-end

1. `cd front_angular && pnpm dev` → `:5175`
2. `cd front_vue && pnpm dev` → `:5173`
3. `cd front_react && pnpm dev` → `:5174`
4. Les trois badges (Vue + React + Angular) visibles sur les trois fronts, switchables
5. Pages publiques : Home, Shows
6. Auth : register, login (avec/sans MFA), redirect
7. Backoffice : CRUD venues, shows
8. Admin : users, user detail (rôle, mot de passe, MFA)
9. Données partagées via le même back `:3000`
