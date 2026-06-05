# Plan — Harmonisation des couleurs du backoffice

## Context

Le backoffice Vue utilise explicitement un thème clair (`<v-app theme="light">`) avec `primary: #6200EE` (deep purple) et fond blanc. React et Angular utilisent un thème sombre avec `primary: #c59a47` (or) et une AppBar bleue hardcodée `#1976d2`. L'objectif est d'aligner React et Angular sur la référence Vue : thème clair, primary violet #6200EE, fond blanc.

---

## Palette de référence (Vue light theme)

| Token           | Valeur      | Usage                          |
|-----------------|-------------|--------------------------------|
| primary         | `#6200EE`   | AppBar, boutons, nav active    |
| secondary       | `#03DAC6`   | Accent secondaire              |
| background      | `#FFFFFF`   | Fond de page                   |
| surface/paper   | `#F5F5F5`   | Drawer, cards, dialogs         |
| nav active bg   | `rgba(98,0,238,0.12)` | Highlight item actif  |

---

## Backlog

### Ticket 1 — React : passage au thème clair (1.5h)
**Branche** : `feature/backoffice-react-light-theme`

Fichiers :
- `front_react/src/theme/index.ts`
  - `mode: 'dark'` → `'light'`
  - `primary.main`: `#c59a47` → `#6200EE`
  - `secondary.main`: `#bb86fc` → `#03DAC6`
  - `background.default`: `#1a1a1a` → `#FFFFFF`
  - `background.paper`: `#2a2a2a` → `#F5F5F5`
  - Supprimer le `backgroundColor: '#1976d2'` de `MuiAppBar` (sera géré par primary)
  - Drawer paper : `#2a2a2a` → `#FFFFFF`, border → `rgba(0,0,0,0.12)`
  - Card : `#222` → `#FFFFFF`, border → `1px solid rgba(0,0,0,0.12)`
  - Dialog paper : `#2a2a2a` → `#FFFFFF`

- `front_react/src/components/layout/AdminLayout.tsx`
  - Active nav item bg : `rgba(197, 154, 71, 0.15)` → `rgba(98, 0, 238, 0.12)` (× 2 occurrences)
  - La couleur `color: 'primary.main'` reste inchangée (s'adapte automatiquement)

Les pages React (`Venues.tsx`, `Shows.tsx`, `Users.tsx`, etc.) n'ont aucune couleur hardcodée — elles utilisent uniquement des tokens MUI (`background.paper`, `color="primary"`, etc.) et s'adapteront sans modification.

---

### Ticket 2 — Angular : thème global et layout (2h)
**Branche** : `feature/backoffice-angular-light-theme-core`
**Dépend de** : aucun (indépendant du ticket 1)

Fichiers :
- `front_angular/src/styles.scss`
  - Remplacer `$primary-palette` (gold #c59a47) par deep purple centré sur `#6200EE` :
    ```
    50:#EDE7F6  100:#D1C4E9  200:#B39DDB  300:#9575CD  400:#7E57C2
    500:#6200EE  600:#5600D4  700:#4B00BA  800:#3F00A0  900:#2D0080
    contrast: noir pour 50-400, blanc pour 500-900
    ```
  - Remplacer `$secondary-palette` (purple #bb86fc) par cyan centré sur `#03DAC6` :
    ```
    50:#E0FEFA  100:#B2FBF5  200:#80F7EF  300:#4DF3E9  400:#26F0E4
    500:#03DAC6  600:#00BFAF  700:#00A699  800:#008C82  900:#006B64
    contrast: noir pour 50-500, blanc pour 600-900
    ```
  - `m2.define-dark-theme` → `m2.define-light-theme`
  - Body : `background-color: #1a1a1a` → `#FFFFFF`, `color: #e0e0e0` → `rgba(0,0,0,0.87)`
  - `.mat-toolbar` override : `#1976d2 !important` → supprimer (ou changer en `#6200EE`) — avec `color="primary"` dans le template, le thème gérera ça
  - `.mat-drawer/.mat-sidenav` : `#2a2a2a !important` → `#FFFFFF !important`, border → `rgba(0,0,0,0.12) !important`
  - `.mat-card/.mat-mdc-card` : `#222 !important` → `#FFFFFF !important`, border → `rgba(0,0,0,0.12) !important`
  - `.mat-mdc-dialog-surface` : `#2a2a2a !important` → `#FFFFFF !important`

- `front_angular/src/app/layout/admin/admin-layout.component.ts`
  - `.nav-item.active-nav`: `rgba(197, 154, 71, 0.15)` → `rgba(98, 0, 238, 0.12)`, `color: #c59a47` → `#6200EE`
  - `mat-icon` dans active-nav : `#c59a47` → `#6200EE`

---

### Ticket 3 — Angular : couleurs hardcodées dans les pages (2h)
**Branche** : `feature/backoffice-angular-page-colors`
**Dépend de** : Ticket 2 (thème doit être en mode clair)

Fichiers à modifier (même pattern dans chaque) :

**`venues.component.ts` et `shows.component.ts`** (même pattern) :
- `.confirm-dialog`: `background: #2a2a2a` → `background: #fff`
- `.confirm-dialog p`: `color: #aaa` → `color: rgba(0,0,0,0.6)`

**`users.component.ts`** :
- `.result-count`: `color: #aaa` → `color: rgba(0,0,0,0.6)`
- `.clickable-row:hover`: `rgba(255,255,255,0.04)` → `rgba(0,0,0,0.04)`
- `.role-chip`: `background: rgba(255,255,255,0.08)` → `rgba(0,0,0,0.08)`, `color: #ccc` → `rgba(0,0,0,0.6)`
- `.role-chip.role-admin`: `rgba(197,154,71,0.2)` → `rgba(98,0,238,0.15)`, `color: #c59a47` → `#6200EE`
- `.confirm-dialog`: `#2a2a2a` → `#fff`
- `.confirm-dialog p`: `#aaa` → `rgba(0,0,0,0.6)`

**`user-detail.component.ts`** :
- `.info-label`: `color: #888` → `rgba(0,0,0,0.6)`
- `.role-chip` (même pattern que users)
- `.mfa-description`: `color: #aaa` → `rgba(0,0,0,0.6)`

**`mfa-setup.component.ts`** :
- `.secret-hint`: `color: #aaa` → `rgba(0,0,0,0.6)`
- `.secret-hint code`: `background: #333` → `rgba(0,0,0,0.08)`, ajouter `color: inherit`

---

## Vérification

1. Lancer chaque frontend (`npm run dev` dans `front_react/` et `front_angular/`)
2. Naviguer vers le backoffice
3. Vérifier visuellement :
   - AppBar : fond violet (#6200EE)
   - Drawer : fond blanc
   - Nav item actif : highlight violet
   - Boutons primaires : violet
   - Dialogs/cards : fond blanc
   - Tableaux : fond clair
   - ADMIN chip : violet au lieu de doré
4. Comparer côte-à-côte avec la version Vue

> Note CLAUDE.md : après approbation du plan, le recopier dans `<project_root>/.claude/plans/` (le plan mode impose `~/.claude/plans/`).
