# Plan : Backend Python (`back_python/`)

## Context

Le projet contient déjà un backend Node.js/Express (`back/`). L'objectif est de créer un second backend en Python (`back_python/`) qui implémente le même contrat d'API REST. Les deux backends sont interchangeables : on en lance un **à la place** de l'autre (jamais simultanément). Les trois frontends (Vue 5173, React 5174, Angular 5175) se connectent sans modification de configuration.

---

## Contrat API à respecter

Tous les champs JSON sont en **camelCase** (correspondant aux types partagés dans `packages/shared/src/types/api.ts`) :

| Routes | Auth |
|---|---|
| POST `/api/auth/register` → `{id, email}` | publique |
| POST `/api/auth/login` → `{token}` ou `{mfaRequired, userId}` ou `{mfaSetupRequired, userId, setupToken}` (HTTP 206 pour MFA) | publique |
| POST `/api/mfa/setup` → `{qrCodeDataURL, secret}` | JWT |
| POST `/api/mfa/login` → `{verified, token}` | publique |
| POST `/api/mfa/verify` → `{verified, token}` | JWT scope:mfa-setup |
| GET/POST/PUT/DELETE `/api/shows` | GET public, reste JWT |
| GET/POST/PUT/DELETE `/api/venues` | GET public, reste JWT |
| 8 routes `/api/users/*` | JWT + self/admin |
| GET `/api/backoffice/shows` + `/venues` | JWT + ADMIN |

**Sécurité à répliquer :** IP ban middleware (global), rate limit login (3/15min), tracking échecs → ban auto, honeypot "admin" dans email.

---

## Stack Python

| Node.js | Python |
|---|---|
| Express | **FastAPI** |
| Prisma ORM | **SQLAlchemy 2.x async** + **Alembic** |
| Zod | **Pydantic v2** |
| jsonwebtoken | **python-jose[cryptography]** |
| bcryptjs | **passlib[bcrypt]** |
| speakeasy | **pyotp** |
| qrcode | **qrcode[pil]** |
| express-rate-limit | **slowapi** |
| Jest + supertest | **pytest + httpx** |

---

## Résolution du problème camelCase / snake_case

Solution **au niveau du backend Python** via Pydantic — aucun adapter côté frontend nécessaire :

```python
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
```

Tous les modèles héritant de `BaseSchema` utilisent snake_case en Python et sérialisent en camelCase dans les réponses JSON (`venue_id` → `venueId`, `created_at` → `createdAt`, `mfa_enabled` → `mfaEnabled`).

**Point critique — noms de colonnes DB :** Prisma crée des colonnes PostgreSQL en camelCase quoté (`"venueId"`, `"createdAt"`, `"mfaSecret"`). Les `mapped_column("venueId", ...)` SQLAlchemy doivent utiliser ces noms explicitement pour partager la même DB que le backend Node.

---

## Structure des fichiers

```
back_python/
├── app/
│   ├── main.py              # FastAPI app, CORS, middleware, routers
│   ├── config.py            # pydantic-settings (JWT_SECRET, DATABASE_URL, etc.)
│   ├── database.py          # async engine, session, Base
│   ├── models.py            # ORM : User, Show, Venue, IpBan, FailedLoginAttempt
│   ├── schemas.py           # Pydantic schemas avec camelCase aliases
│   ├── auth.py              # create_token / verify_token (JWT)
│   ├── dependencies.py      # get_current_user, require_admin, require_self_or_admin
│   ├── routers/
│   │   ├── auth.py          # register + login (honeypot, MFA branching, 206)
│   │   ├── mfa.py           # setup, login, verify
│   │   ├── shows.py         # CRUD + selectinload venue
│   │   ├── venues.py        # CRUD + 409 FK conflict
│   │   ├── users.py         # 8 routes
│   │   └── backoffice.py    # 2 routes admin
│   ├── middleware/
│   │   └── ip_ban.py        # BaseHTTPMiddleware : purge expiré + check
│   └── utils/
│       ├── login_attempts.py # handle_failed_login, ban_ip
│       └── alerts.py         # send_admin_ban_alert (aiosmtplib)
├── alembic/                  # migrations (schema identique à Prisma)
├── alembic.ini
├── tests/
│   ├── conftest.py           # AsyncClient + SQLite in-memory
│   ├── test_auth.py
│   ├── test_mfa.py
│   ├── test_shows.py
│   ├── test_venues.py
│   ├── test_users.py
│   └── test_backoffice.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml        # API + PostgreSQL (mêmes credentials que back/)
└── .env.example
```

---

## Points d'implémentation délicats

**HTTP 206** : FastAPI n'accepte pas `status_code=206` comme décorateur. Utiliser `return JSONResponse(content={...}, status_code=206)` explicitement dans les routes MFA branching.

**Rate limiting** : `slowapi` nécessite `request: Request` comme premier paramètre de la route + `@limiter.limit("3/15 minutes")`. Le limiter vit sur `app.state.limiter`. Handler 429 personnalisé pour matcher le body Node `{"error": "Identifiants invalides"}`.

**`mfaEnabled` est calculé** : pas de colonne DB. Dans `UserOut.from_orm_user()` : `mfa_enabled = user.mfaSecret is not None`. Ne jamais exposer `mfaSecret`.

**SQLite vs PostgreSQL** : `DATABASE_URL=sqlite+aiosqlite:///./dev.db` (local) vs `postgresql+asyncpg://...` (Docker). L'enum `Role` pose problème sur SQLite → SQLAlchemy le stocke en `VARCHAR`, identique au comportement Prisma.

**Timezone** : Toujours `datetime.now(timezone.utc)` côté Python.

---

## Dev local vs Docker

```bash
# Local (SQLite)
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 3000

# Docker (PostgreSQL)
docker-compose up --build
docker-compose exec api alembic upgrade head
```

Port **3000** identique au backend Node → zéro changement de config côté frontends.

---

## Fichiers critiques à consulter pendant l'implémentation

- [back/prisma/schema.prisma](back/prisma/schema.prisma) — schéma DB de référence pour les migrations Alembic
- [back/src/routes/auth.ts](back/src/routes/auth.ts) — route la plus complexe (honeypot, MFA branching, failed login)
- [back/src/routes/users.ts](back/src/routes/users.ts) — 8 endpoints avec 2 niveaux d'autorisation
- [packages/shared/src/types/api.ts](packages/shared/src/types/api.ts) — référence pour chaque nom de champ JSON attendu par les frontends
- [back/docker-compose.yml](back/docker-compose.yml) — config Docker/Postgres à reproduire

---

## Vérification end-to-end

1. `uvicorn app.main:app --reload` démarre sur port 3000
2. `curl localhost:3000/` → `{"status": "ok"}`
3. Register + login via curl → token JWT reçu
4. `GET /api/shows` retourne `venueId` (camelCase) dans le JSON
5. Frontend Vue (`pnpm dev` dans `front_vue/`) se connecte sans erreur CORS
6. `pytest tests/` → tous les tests passent
7. `docker-compose up --build` + `docker-compose exec api alembic upgrade head` → OK

---

## Backlog priorisé

| # | Item | Durée | Dépend de |
|---|---|---|---|
| BP-1 | Scaffold, config, database.py, models.py, Alembic migration initiale | ~1h30 | — |
| BP-2 | schemas.py (camelCase), auth.py (JWT), dependencies.py | ~1h | BP-1 |
| BP-3 | main.py, CORS, IPBanMiddleware, Dockerfile, docker-compose | ~1h30 | BP-1, BP-2 |
| BP-4 | Routers auth (register/login) + utils (login_attempts, alerts) + rate limit + tests | ~2h | BP-1, BP-2, BP-3 |
| BP-5 | Router MFA (setup/login/verify) + tests | ~1h30 | BP-2, BP-4 |
| BP-6 | Routers shows + venues (CRUD) + tests | ~2h | BP-2, BP-3 |
| BP-7 | Router users (8 routes) + tests | ~2h30 | BP-2, BP-6 |
| BP-8 | Router backoffice + tests | ~1h | BP-6, BP-7 |
| BP-9 | CLAUDE.md update + README section "switcher de backend" | ~30min | BP-3 |

**Total estimé : ~13h**

```
BP-1 → BP-2 → BP-3 → BP-4 → BP-5
                   ↘
                    BP-6 → BP-8 → BP-9
                   ↗
              BP-7 ↗
```
