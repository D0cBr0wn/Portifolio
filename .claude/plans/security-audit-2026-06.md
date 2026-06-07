# Security Audit — Juin 2026

## Méthodologie

Audit conduit par analyse statique multi-agents (exploration codebase + filtrage faux positifs indépendant).
Périmètre : `back/` (Node.js), `back_python/` (Python/FastAPI), `front_vue/`, `front_react/`, `front_angular/`.

---

## Findings confirmés

| # | Sévérité | Confiance | Composant | Résumé |
|---|----------|-----------|-----------|--------|
| SEC-1 | HIGH | 9/10 | back/src/routes/mfa.ts | Scope `mfa-setup` non vérifié sur `POST /mfa/setup` |
| SEC-2 | HIGH | 9/10 | back_python/app/config.py | Secret JWT par défaut connu dans le code source public |
| SEC-3 | MEDIUM | 8/10 | back/src/routes/mfa.ts | Scope `mfa-setup` non vérifié sur `POST /mfa/verify` |
| SEC-4 | MEDIUM | 8/10 | back/ + back_python/ | PUT/DELETE shows & venues accessible à tout utilisateur authentifié |

### Findings rejetés

- **Race condition premier admin** (confiance 3/10) : fenêtre d'exploitation de quelques millisecondes lors d'une registration initiale, bcrypt allonge le délai. Théorique dans le contexte d'un projet portfolio.

---

## Détail des findings

### SEC-1 — Scope manquant sur `POST /mfa/setup` (Node.js) · HIGH

**Fichier :** `back/src/routes/mfa.ts` lignes 11–26

**Description :**  
`POST /mfa/setup` est protégé uniquement par `authenticateToken` (token standard). Il n'exige pas le scope `mfa-setup`. N'importe quel utilisateur tenant un token de session complet peut appeler cet endpoint, générer un nouveau secret TOTP, le récupérer en clair dans la réponse, et écraser l'ancien secret en base.

Le backend Python fait correctement la même chose via la dépendance `get_mfa_setup_user` (scope enforced). Les routes voisines `POST /mfa/login` et `POST /mfa/verify` du même fichier vérifient déjà leur scope respectif.

**Exploit :**  
Appeler `POST /api/mfa/setup` avec n'importe quel JWT valide → reçoit un QR code + seed base32 en clair → peut prendre le contrôle du second facteur d'un compte en forçant la ré-enrôlement.

**Fix :**  
```ts
if (req.user?.scope !== 'mfa-setup') {
  res.status(403).json({ error: 'Scope insuffisant' })
  return
}
```

---

### SEC-2 — Secret JWT par défaut connu publiquement (Python) · HIGH

**Fichier :** `back_python/app/config.py` ligne 8

**Description :**  
`jwt_secret` a une valeur par défaut hardcodée `"change_me_in_production_use_32b!"` dans le code source public. Si `JWT_SECRET` n'est pas défini dans l'environnement, l'application démarre sans erreur et signe tous les tokens avec cette clé publiquement connue. Aucun validator n'empêche le démarrage avec la valeur par défaut.

**Exploit :**  
Lire le code source public → construire un JWT `{"role": "ADMIN", ...}` signé avec la clé connue → accès complet à toutes les routes admin.

**Fix :**  
Supprimer la valeur par défaut OU ajouter un `@model_validator` qui lève une erreur au démarrage si la valeur correspond au placeholder :
```python
@model_validator(mode="after")
def validate_jwt_secret(self):
    if self.jwt_secret == "change_me_in_production_use_32b!":
        raise ValueError("JWT_SECRET must be set to a unique secret in production")
    return self
```

---

### SEC-3 — Scope manquant sur `POST /mfa/verify` (Node.js) · MEDIUM

**Fichier :** `back/src/routes/mfa.ts` lignes 62–96

**Description :**  
`POST /mfa/verify` est accessible avec n'importe quel JWT valide. Un porteur d'un token `mfa-setup` peut appeler cet endpoint, vérifier un code TOTP, et recevoir un token de session complet — contournant le flux d'enrollment prévu. Le flag `isMfaSetup` est lu depuis le scope mais le refus d'accès aux tokens hors-scope est absent.

**Fix :**  
```ts
if (req.user?.scope !== 'mfa-setup') {
  res.status(403).json({ error: 'Scope insuffisant' })
  return
}
```

---

### SEC-4 — Mutations shows/venues accessibles à tout utilisateur authentifié · MEDIUM

**Fichiers :** `back/src/routes/shows.ts`, `back/src/routes/venues.ts`, `back_python/app/routers/shows.py`, `back_python/app/routers/venues.py`

**Description :**  
`PUT` et `DELETE` sur shows et venues sont protégés par `authenticateToken` uniquement. Aucune vérification de rôle (`requireAdmin`) ni d'appartenance (`createdById`). L'infrastructure existe dans les deux backends (middleware `requireAdmin`, champ `createdById` en base, `require_admin` en Python) mais n'est pas câblée sur ces routes.

**Exploit :**  
Tout utilisateur avec rôle `USER` peut supprimer ou modifier n'importe quel concert ou lieu, y compris ceux créés par l'admin.

**Fix :**  
Ajouter `requireAdmin` sur les routes mutations (si seuls les admins doivent modifier), ou vérifier `createdById === req.user.userId || req.user.role === 'ADMIN'`.

---

## Backlog priorisé

### SEC-B1 · fix(back): enforce mfa-setup scope on POST /mfa/setup + /mfa/verify (Node.js)
**Priorité : P0 — HIGH**  
**Temps estimé : 1h**  
**Dépendances : aucune**

- Ajouter la vérification `scope !== 'mfa-setup'` → 403 en tête des handlers `/mfa/setup` et `/mfa/verify` dans `back/src/routes/mfa.ts`
- Mettre à jour les tests d'intégration `back/src/__tests__/integration/mfa.test.ts` : ajouter un test vérifiant que `/mfa/setup` retourne 403 avec un token full-session (pas de scope), et idem pour `/mfa/verify`
- Vérifier que les tests Node.js passent (143/143)

---

### SEC-B2 · fix(back_python): require JWT_SECRET at startup, remove default
**Priorité : P0 — HIGH**  
**Temps estimé : 1h**  
**Dépendances : aucune**

- Modifier `back_python/app/config.py` : supprimer la valeur par défaut de `jwt_secret` OU ajouter un `@model_validator` qui rejette le placeholder au démarrage
- Mettre à jour `back_python/.env.example` pour documenter que la valeur doit être remplacée
- Vérifier que `pytest tests/` passe (42/42) — les tests injectent leur propre `JWT_SECRET` via les fixtures

---

### SEC-B3 · fix(back): require admin role on PUT/DELETE shows + venues (Node.js)
**Priorité : P1 — MEDIUM**  
**Temps estimé : 2h**  
**Dépendances : aucune**

- Câbler le middleware `requireAdmin` sur `PUT /api/shows/:id`, `DELETE /api/shows/:id`, `PUT /api/venues/:id`, `DELETE /api/venues/:id` dans `back/src/routes/`
- Mettre à jour les tests d'intégration pour les routes shows et venues : vérifier que les appels sans rôle ADMIN retournent 403
- Vérifier que les frontends ne cassent pas (les 3 frontends utilisent les tokens admin pour les mutations backoffice)
- Vérifier que les tests Node.js passent

---

### SEC-B4 · fix(back_python): require admin role on PUT/DELETE shows + venues (Python)
**Priorité : P1 — MEDIUM**  
**Temps estimé : 2h**  
**Dépendances : SEC-B3 (même logique, peut être fait en parallèle)**

- Ajouter la dépendance `require_admin` sur les endpoints `PUT`/`DELETE` dans `back_python/app/routers/shows.py` et `venues.py`
- Mettre à jour les tests dans `back_python/tests/test_shows.py` et `test_venues.py` : vérifier que USER-role → 403 sur les mutations
- Vérifier que `pytest tests/` passe (42+/42)

---

## Ordre de livraison recommandé

```
SEC-B1 (P0, Node.js MFA scopes)
  └─ PR → dev

SEC-B2 (P0, Python JWT secret)
  └─ PR → dev

SEC-B3 (P1, Node.js admin sur mutations)
  └─ PR → dev

SEC-B4 (P1, Python admin sur mutations)
  └─ PR → dev
```

SEC-B1 et SEC-B2 sont indépendants et peuvent être traités en parallèle.  
SEC-B3 et SEC-B4 couvrent le même finding sur deux backends, indépendants l'un de l'autre.
