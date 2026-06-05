# Plan : Back Python + Hot-Switch entre backends

## Contexte

Le projet "Odyssey of One" expose déjà plusieurs frontends (Vue, React, Angular) qui se connectent tous au même backend Node.js/Express sur le port 3000. L'idée est de faire la même chose côté backend : un second backend Python (FastAPI) qui implémente le même contrat d'API, et un mécanisme pour basculer à chaud entre les deux lors d'une démo — sans toucher aucun frontend, sans rebuild, sans rechargement de page.

## Architecture cible

```
Frontends (:5173 / :5174 / :4200)
        │ tous pointent vers http://localhost:3000/api
        ▼
  OpenResty/nginx  (:3000)   ← seul point d'entrée stable
        │
  ┌─────┴──────┐
  │            │
  back_node   back_python
  (:3001)     (:3002)
  │            │
  └────────────┘
       PostgreSQL (:5432)  ← base partagée, schéma géré par Prisma
```

Les deux backends tournent en permanence. Le proxy route toutes les requêtes vers l'actif. La bascule est instantanée (Lua shared dict, pas de reload nginx).

## Mécanisme de hot-switch

**OpenResty (nginx + Lua)** sur le port 3000. Un `lua_shared_dict` stocke quel upstream est actif. Deux endpoints spéciaux :

- `POST /switch/node` → redirige vers `back_node:3001`
- `POST /switch/python` → redirige vers `back_python:3002`
- `GET /api/active-backend` → retourne `{"backend": "node"}` ou `{"backend": "python"}`

Chaque réponse proxiée porte le header `X-Active-Backend: node|python` — visible dans le Network tab lors d'une démo.

Pas de sidecar switcher, pas de reload nginx, pas de docker restart. La bascule prend effet à la prochaine requête.

## Stack Python

**FastAPI + SQLAlchemy async + Pydantic v2**

- `fastapi` + `uvicorn[standard]` — router/middleware
- `sqlalchemy[asyncio]` + `asyncpg` — accès DB (pas Alembic : le schéma est déjà géré par Prisma)
- `pydantic-settings` — config via env vars
- `python-jose[cryptography]` — JWT (même `HS256`, même secret, même payload shape que jsonwebtoken)
- `passlib[bcrypt]` — compatible avec `bcryptjs` Node.js (coût 12, cross-compatible)
- `pyotp` — TOTP compatible avec `speakeasy` Node.js (même RFC 6238, même secret base32 en DB)
- `slowapi` — rate limiting (équivalent express-rate-limit)

Les modèles SQLAlchemy reflètent le schéma Prisma existant (les noms de colonnes SQL, pas les noms Prisma). Pas de migration Python.

## Fichiers à créer

### Nouveau docker-compose racine
`/Portifolio/docker-compose.yml` — orchestre postgres + back_node (:3001) + back_python (:3002) + proxy (:3000). Le `back/docker-compose.yml` reste pour le dev Node.js standalone.

### Proxy
```
proxy/
  nginx.conf        # OpenResty Lua : routing + /switch/* + /api/active-backend
```

### Backend Python
```
back_python/
  Dockerfile
  requirements.txt
  app/
    main.py          # FastAPI app, CORS, routers montés
    config.py        # pydantic-settings
    database.py      # SQLAlchemy async engine
    models/          # ORM : User, Show, Venue, IpBan, FailedLoginAttempt
    schemas/         # Pydantic : auth, show, venue, user
    routers/         # auth, mfa, shows, venues, users, backoffice
    middleware/      # JWT dep, IP ban, rate limit
```

### Fronts (extension mineure)
Chaque TechBadge existant (Vue : `front_vue/src/components/TechBadge.vue`, React : `front_react/src/components/TechBadge.tsx`, Angular : composant à identifier) est étendu pour :
- Appeler `GET /api/active-backend` au mount
- Afficher l'indicateur backend actif (Node.js / Python) avec son logo
- Fournir un bouton ou raccourci (`Alt+B`) pour basculer via `POST /switch/{backend}`

## Points de compatibilité critiques à vérifier

| Point | Node.js | Python | Statut |
|-------|---------|--------|--------|
| JWT payload | `{userId, email, role, scope?}` | identique via python-jose | à vérifier à l'implémentation |
| bcrypt | `bcrypt.hash(pwd, 12)` | `passlib.hash.bcrypt.using(rounds=12)` | cross-compatible ✓ |
| TOTP | `speakeasy`, window=1 | `pyotp.TOTP.verify(valid_window=1)` | cross-compatible ✓ |
| IP réelle | Express `trust proxy 1` | uvicorn `--proxy-headers` | à configurer |
| CORS | `FRONTEND_URL` env var | même logique | à porter |

## Séquence d'implémentation

1. **Proxy d'abord** — créer `proxy/nginx.conf` OpenResty + `docker-compose.yml` racine avec `back_node` sur :3001. Vérifier que les fronts continuent de fonctionner sans toucher leur code.
2. **Scaffold Python** — structure vide, Dockerfile, requirements, sanity check `GET /api/health`.
3. **Routes publiques** — `GET /api/shows` et `GET /api/venues` (lecture seule, pas d'auth). Valider la compatibilité des réponses JSON avec `@portfolio/shared`.
4. **Auth** — `POST /api/auth/register` et `/login`, JWT cross-compatible. Test : login via Node, token utilisé sur Python.
5. **Routes protégées** — shows/venues write, users, backoffice.
6. **MFA** — setup + verify, valider que le secret TOTP en DB fonctionne des deux côtés.
7. **Badge frontend** — indicateur backend + bouton de switch dans les TechBadges.

## Vérification

```bash
# Démarrer tout
docker compose up --build

# Vérifier backend actif
curl http://localhost:3000/api/active-backend
# → {"backend": "node"}

# Basculer sur Python
curl -X POST http://localhost:3000/switch/python
# → {"switched": "python"}

# Vérifier
curl http://localhost:3000/api/active-backend
# → {"backend": "python"}

# Les frontends fonctionnent toujours sans rebuild
# Le header X-Active-Backend est visible dans Network tab
```

Tests d'intégration clés :
- Login via Node → token → requête protégée via Python → 200 OK (JWT cross-compatible)
- Créer un show via Node → switcher → lire le show via Python → données identiques
- MFA setup via Node → switcher → MFA verify via Python → succès (TOTP cross-compatible)
