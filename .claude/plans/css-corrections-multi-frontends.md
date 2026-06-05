# Plan — Corrections CSS multi-frontends

## Contexte

Le projet expose trois frontends (Vue, React, Angular) qui partagent le même domaine métier et doivent présenter une apparence cohérente. Actuellement, Vue sert de référence visuelle mais React et Angular présentent des écarts de taille de typographie et des favicons génériques/absents. L'objectif est : (1) favicon par techno, (2) typographie harmonisée sur Vue, (3) tailles de tech badges vérifiées.

---

## 1. Favicons par technologie

### État actuel
| Frontend | Fichier | Statut |
|---|---|---|
| `front_vue/` | `index.html` → `/favicon.png` | **Fichier manquant**, pas de dossier `public/` |
| `front_react/` | `public/favicon.svg` | Existe mais **logo violet générique** (pas React) |
| `front_angular/` | `public/favicon.ico` | Existe mais **Angular par défaut** (icône générique) |

### Changements
**Vue** — créer `front_vue/public/favicon.svg` avec le logo Vue (SVG #41b883/#34495e), mettre à jour `index.html` :
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

**React** — remplacer `front_react/public/favicon.svg` par le logo React (SVG #61dafb, ellipses + cercle).

**Angular** — créer `front_angular/public/favicon.svg` avec le logo Angular (SVG #dd0031/#c3002f), mettre à jour `src/index.html` :
```html
<link rel="icon" type="image/svg+xml" href="favicon.svg">
```

Les SVG des logos sont déjà disponibles inline dans les TechBadge de chaque frontend — il suffit de les extraire.

---

## 2. Harmonisation CSS (référence : Vue)

### Hero title (`.artist-name` dans Vue = `font-size: 3.5rem`)

| Frontend | Valeur actuelle | Action |
|---|---|---|
| Vue `HomeView.vue:68` | `3.5rem` | référence, rien à faire |
| React `Home.tsx:25` | MUI `variant="h2"` → 3.75rem (défaut) | Ajouter `fontSize: '3.5rem'` dans le `sx` |
| Angular `home.component.ts:74` | `2.5rem` | Changer en `3.5rem` |

### Tagline / description (`.tagline` dans Vue = `font-size: 1.2rem`)

| Frontend | Valeur actuelle | Action |
|---|---|---|
| Vue `HomeView.vue:79` | `1.2rem` | référence |
| React `Home.tsx:28` | `1.2rem` (déjà dans sx) | rien à faire ✓ |
| Angular `home.component.ts:79` | `1.1rem` | Changer en `1.2rem` |

### Section title "Prochains concerts" (Vue = `font-size: 1.4rem`)

| Frontend | Valeur actuelle | Action |
|---|---|---|
| Vue `HomeView.vue:89` | `1.4rem` | référence |
| React `Home.tsx:43` | MUI `variant="h6"` → 1.25rem (défaut) | Ajouter `fontSize: '1.4rem'` dans le `sx` |
| Angular `home.component.ts:91` | `1.1rem` | Changer en `1.4rem` |

### Margin section title (Vue = `margin-bottom: 1.5rem`)

| Frontend | Valeur actuelle | Action |
|---|---|---|
| Vue `HomeView.vue:90` | `margin-bottom: 1.5rem` | référence |
| Angular `home.component.ts:96` | `margin: 0 0 1rem` | Changer en `margin: 0 0 1.5rem` |

### Nav active border-bottom
- Vue (`PublicLayout.vue`) et React (`PublicLayout.tsx:56`) : `border-bottom: 2px solid #000` (noir — peu visible sur fond sombre/image)
- Angular (`public-layout.component.ts:71`) : `border-bottom-color: #c59a47` (or — plus visible)

**Choix retenu** : harmoniser Angular sur Vue → changer `#c59a47` → `#000000`. À noter que `#000` sur l'image de fond sombre est quasi invisible des deux côtés — ce comportement est identique à Vue/React.

---

## 3. Taille des tech badges

Après inspection du code, **les trois frontends utilisent déjà 28px** en largeur :
- Vue : `.tech-badge { width: 28px; }` + `svg { width: 100%; height: auto; }`
- React : `BASE = { width: 28 }` + `style={{ width: '100%', height: 'auto' }}` sur chaque SVG
- Angular : `.badge-link { width: 28px; }` + `svg { width: 100%; height: auto; }`

Le code est déjà harmonisé. La **hauteur diffère** due aux viewBox des logos :
- Vue (261×227) → ~24.2px de haut à 28px de large
- React (23×20.5) → ~24.9px de haut
- Angular (250×250) → 28px de haut (carré)

**Action** : ajouter `height: 28px` aux conteneurs badge (`.tech-badge`, `BASE`, `.badge-link`) pour un bounding-box uniforme. Le SVG `preserveAspectRatio="xMidYMid meet"` (défaut) centre et ajuste chaque logo dans la boîte.

---

## Fichiers à modifier

| Fichier | Modification |
|---|---|
| `front_vue/index.html` | Changer ref favicon → `/favicon.svg` |
| `front_vue/public/favicon.svg` | **Créer** — logo Vue SVG |
| `front_vue/src/components/TechBadge.vue` | `.tech-badge { height: 28px }` |
| `front_react/public/favicon.svg` | **Remplacer** — logo React SVG |
| `front_react/src/pages/Home.tsx` | `fontSize: '3.5rem'` sur le titre, `fontSize: '1.4rem'` sur la section |
| `front_react/src/components/TechBadge.tsx` | `BASE.height = 28` |
| `front_angular/src/index.html` | Changer ref favicon → `.svg` |
| `front_angular/public/favicon.svg` | **Créer** — logo Angular SVG |
| `front_angular/src/app/pages/home/home.component.ts` | `.hero-title` 3.5rem, `.hero-desc` 1.2rem, `.section-title` 1.4rem + margin 1.5rem |
| `front_angular/src/app/layout/public/public-layout.component.ts` | Nav active border `#000` |
| `front_angular/src/app/shared/components/tech-badge.component.ts` | `.badge-link { height: 28px }` |

---

## Vérification

- Lancer les trois devservers (`npm run dev` dans chaque front) et vérifier :
  - Onglet navigateur : favicon correct sur chaque frontend (Vue vert, React cyan, Angular rouge)
  - Page d'accueil : titre "Portfolio" visuellement identique en taille sur les trois
  - Corner badges : les trois logos dans des cases de même hauteur

---

## Backlog priorisé

> Chaque item est indépendant et livrable séparément (commit + PR distinct).

### [P1] Favicons par technologie — ~1h30
Créer et câbler le favicon correspondant à chaque techno (Vue/React/Angular).
- Vue : créer `public/`, logo Vue SVG, mise à jour `index.html`
- React : remplacer `public/favicon.svg` par logo React SVG
- Angular : créer `public/favicon.svg` logo Angular, mise à jour `src/index.html`
- **Pas de dépendance amont**

### [P2] Typographie Angular — ~1h
Corriger les tailles de texte dans `front_angular/src/app/pages/home/home.component.ts` pour matcher Vue :
- `.hero-title` : 2.5rem → 3.5rem
- `.hero-desc` : 1.1rem → 1.2rem
- `.section-title` : 1.1rem → 1.4rem, margin 1rem → 1.5rem
- **Pas de dépendance amont**

### [P3] Typographie React — ~30min
Corriger les tailles de texte dans `front_react/src/pages/Home.tsx` pour matcher Vue :
- Titre : ajouter `fontSize: '3.5rem'` sur la Typography h2
- "Prochains concerts" : ajouter `fontSize: '1.4rem'` sur la Typography h6
- **Pas de dépendance amont**

### [P4] Nav active Angular — ~30min
Dans `front_angular/src/app/layout/public/public-layout.component.ts` : changer `border-bottom-color` du lien actif de `#c59a47` → `#000000` (alignement sur Vue et React).
- **Dépendance logique** : peut être inclus dans [P2] si les deux changements Angular sont bundlés

### [P5] Tech badge height uniforme — ~1h
Ajouter `height: 28px` sur les conteneurs badge dans les trois frontends pour que tous les logos occupent la même boîte visuelle.
- `front_vue/src/components/TechBadge.vue` : `.tech-badge { height: 28px }`
- `front_react/src/components/TechBadge.tsx` : `BASE.height = 28`
- `front_angular/src/app/shared/components/tech-badge.component.ts` : `.badge-link { height: 28px }`
- **Pas de dépendance amont**, peut être groupé en un seul PR cross-frontend
