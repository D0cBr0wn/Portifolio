# Plan : Aligner le bouton "Voir tous les concerts" Angular sur le design Vue

## Context

Le bouton de navigation vers `/shows` sur la home Angular ne correspond pas visuellement à celui de la home Vue (référence design du projet).

La différence principale vient des styles par défaut d'**Angular Material M2 MDC** vs **Vuetify 3** :
- Angular Material M2 applique `text-transform: uppercase` et `letter-spacing: 0.089em` aux boutons par défaut
- Vuetify 3 `v-btn variant="text"` n'applique pas d'uppercase et utilise un letter-spacing normal

Résultat : "VOIR TOUS LES CONCERTS" (Angular) vs "Voir tous les concerts" (Vue).

---

## Fichier à modifier

`front_angular/src/app/pages/home/home.component.ts` — styles inline, classe `.see-all-btn` (ligne 125–128)

---

## Changement

Dans les `styles` du composant Angular, mettre à jour `.see-all-btn` :

```css
/* Avant */
.see-all-btn {
  margin-top: 1rem;
  color: #c59a47;
}

/* Après */
.see-all-btn {
  margin-top: 1rem;
  color: #c59a47;
  text-transform: none;
  letter-spacing: normal;
}
```

Les deux overrides forcent l'alignement avec le rendu Vuetify qui est la référence.

---

## Vérification

1. Lancer `front_angular` : `cd front_angular && ng serve`
2. Naviguer sur la home
3. Vérifier que le bouton affiche "Voir tous les concerts" (pas uppercase, pas de letter-spacing excessif)
4. Comparer visuellement avec `front_vue` sur la même page

---

## Backlog

| # | Tâche | Taille | Dépendances |
|---|-------|--------|-------------|
| 1 | Fix bouton home Angular (text-transform + letter-spacing) | 30 min | — |
