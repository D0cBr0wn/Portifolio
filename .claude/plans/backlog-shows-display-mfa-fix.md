# Backlog — Affichage concerts en ligne + MFA Portfolio

> Plan à copier dans `.claude/plans/` à la racine du projet.

## Contexte

Deux corrections ciblées sur le front Vue et le backend :

1. **Affichage concerts** : la page publique `/shows` affiche un tableau à 4 colonnes (Date, Concert, Lieu, Ville). Le remplacer par un affichage une-ligne par concert, plus naturel pour un site d'artiste : `05/09/2025  Bar du Minage — Angoulême (16)  + Noé Talbot (Québec)`. Le champ `details` existant fournit la partie `+ Noé Talbot (Québec)`.

2. **MFA Auboulot** : `back/src/routes/mfa.ts:15` contient encore `name: \`Auboulot (${email})\`` — le nom affiché dans Google Authenticator lors du scan du QR code. Remplacer par `Portfolio`.

---

## T-A — Page concerts : affichage en ligne  *(~1h)*

**Fichiers :** `front_vue/src/views/ShowsView.vue`

**Format cible par ligne :**
```
DD/MM/YYYY   VenueName — City (ZipCode)   + details
```
- Date : format `DD/MM/YYYY` (nouvelle fonction utilitaire locale, `getFormattedDate()` retourne du texte long en français — pas adapté ici)
- Séparateur lieu : ` — ` entre nom et ville
- ZipCode : affiché entre parenthèses s'il existe : `Angoulême (16000)` ou sans si absent
- Détails : précédés de ` + ` s'ils existent, absents sinon
- `label` (nom du concert) : optionnel depuis T-01 — si présent, l'afficher en italique sous la ligne principale (une 2e ligne sobre)

**Remplacement dans le template :**
- Supprimer `<v-table>` avec `<thead>` / `<tbody>` / colonnes
- Remplacer par une liste `<ul>` / `<li>` (ou `<div>`) stylée, une entrée par show
- Conserver les sections "À venir" (normal) et "Passés" (opacity 0.5) existantes
- Conserver les styles `.date-col`, `.section-title`, `.muted`, `.empty`

**Fonction de formatage à ajouter dans le script :**
```ts
function formatShowLine(show: Show): string {
  const d = show.date
  const date = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  const zip = show.venue?.zipCode ? ` (${show.venue.zipCode})` : ''
  const venue = show.venue ? `${show.venue.name} — ${show.venue.city}${zip}` : '—'
  const details = show.details ? ` + ${show.details}` : ''
  return `${date}  ${venue}${details}`
}
```

**Tests à mettre à jour :**
- `front_vue/e2e/shows.spec.ts` : les assertions qui cherchent des éléments `<th>` ou la structure de table (si présentes) → adapter au nouveau markup
- `cd front_vue && pnpm test:e2e` si le serveur tourne, sinon `pnpm test`

---

## T-B — LoginView : lien Register sous le formulaire MFA  *(~10min)*

**Fichier :** `front_vue/src/views/LoginView.vue`

Le lien "Créer un compte (démo)" est actuellement dans le `<div>` extérieur à la carte, aligné à droite. Le déplacer à l'intérieur de la `<v-card-text>`, centré, **sous les deux étapes du formulaire** (credentials et MFA), avec la même apparence sobre.

---

## T-C — MFA : Auboulot → Portfolio  *(~15min)*

**Fichier :** `back/src/routes/mfa.ts`

**Changement :**
```ts
// ligne 15 — avant
name: `Auboulot (${req.user?.email})`,

// après
name: `Portfolio (${req.user?.email})`,
```

⚠️ Les utilisateurs ayant déjà configuré le MFA avec le nom "Auboulot" verront le label changer dans leur app d'authentification à la prochaine configuration. Les codes TOTP continuent de fonctionner (le nom est cosmétique).

**Tests :**
- `back/src/__tests__/integration/mfa.test.ts` : vérifier si un test vérifie le champ `name` dans `generateSecret` — si oui, mettre à jour l'assertion
- `cd back && npm test -- --testPathPattern=mfa`

---

## Récapitulatif

| Ticket | Sujet | Durée |
|---|---|---|
| T-A | Affichage concerts en ligne (ShowsView) | ~1h |
| T-B | LoginView : lien Register sous le formulaire MFA | ~10min |
| T-C | MFA : Auboulot → Portfolio | ~15min |
| **Total** | | **~1h25** |
