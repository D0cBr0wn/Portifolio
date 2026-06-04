# Plan — Port front_vue → front_react

## Contexte

Le projet contient `front_vue/` (Vue 3 + Vite + Vuetify + Pinia, port 5173) et `front_nuxt/`.
Objectif : créer `front_react/` — mêmes fonctionnalités, même look, même back — en React.
Les deux fronts affichent un badge Vue et React en bas à droite pour switcher entre eux.

## Stack React

| Besoin | Vue | React |
|--------|-----|-------|
| Build | Vite | Vite |
| UI | Vuetify 3 | MUI (Material UI) v6 |
| Routing | Vue Router | React Router v7 |
| State | Pinia | Zustand v5 |
| Icons | @mdi/font | @mui/icons-material |
| Types | @portfolio/shared | @portfolio/shared (workspace) |
| DataGrid | v-data-table | @mui/x-data-grid |

Port React : **5174** (Vue = 5173).

## Backlog — branches créées (stacked, T1 → T17)

| Branche | Tâche |
|---------|-------|
| `feature/react-t1-setup` | Setup projet Vite + workspace |
| `feature/react-t2-theme` | Thème MUI + ThemeProvider |
| `feature/react-t3-services` | Couche services API |
| `feature/react-t4-auth-routing` | Auth store Zustand + React Router + guards |
| `feature/react-t5-public-layout` | PublicLayout |
| `feature/react-t6-admin-layout` | AdminLayout |
| `feature/react-t7-stores` | Stores show/venue/user |
| `feature/react-t8-home` | Page Home |
| `feature/react-t9-shows` | Page Shows |
| `feature/react-t10-techbadge` | TechBadge Vue+React sur les deux fronts |
| `feature/react-t11-login` | Page Login (3 étapes MFA) |
| `feature/react-t12-register` | Page Register |
| `feature/react-t13-venues` | Backoffice Venues (VenueForm + DataGrid) |
| `feature/react-t14-shows-bo` | Backoffice Shows (ShowForm + DataGrid) |
| `feature/react-t15-mfa-setup` | Backoffice MFA Setup |
| `feature/react-t16-users` | Backoffice Users |
| `feature/react-t17-user-detail` | Backoffice UserDetail |

## Ordre de merge

Les branches sont stacked — merger dans l'ordre T1 → T17, chacune vers `dev`.
Après merge de T1, T2 montre le delta T2 uniquement, etc.

## Vérification end-to-end

1. `cd front_react && pnpm dev` → `:5174`
2. `cd front_vue && pnpm dev` → `:5173`
3. Les deux badges (Vue + React) visibles sur les deux fronts, switchable
4. Pages publiques : Home, Shows
5. Auth : register, login (avec/sans MFA), redirect
6. Backoffice : CRUD venues, shows
7. Admin : users, user detail (role, password, MFA)
8. Données partagées via le même back `:3000`
