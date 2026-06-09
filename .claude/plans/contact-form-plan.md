# Plan — Formulaire de contact (Contact Form)

## Objectif

Permettre aux visiteurs du site OdysseyOfOne d'envoyer des messages via un formulaire de contact, sans dépendance à un serveur SMTP. Les messages sont stockés en base de données (Prisma/PostgreSQL) et consultables via la page backoffice admin (`/backoffice/messages`) protégée par JWT + rôle ADMIN. La feature est implémentée dans les 3 frontends (Vue, React, Angular).

---

## Scope

### Dans le scope
- Modèle Prisma `ContactMessage` (nom, email, message, createdAt)
- Endpoint `POST /api/contact` — public, rate-limité (20 req / 10 min par IP)
- Endpoint `GET /api/contact` — protégé par `authenticateToken` + `requireAdmin`
- Validation Zod : `name` ≤ 100 chars, `email` format valide, `message` ≤ 2000 chars
- `contactLimiter` dédié dans `rateLimiterMiddleware.ts`
- Tests d'intégration backend
- Page `/contact` avec formulaire dans Vue, React, Angular — feedback inline succès + reset
- Lien "Contact" dans la nav publique des 3 frontends
- Page `/backoffice/messages` avec liste tronquée + modale message complet dans Vue, React, Angular
- Lien "Messages" dans la nav backoffice des 3 frontends
- Service `contactService` dans chaque frontend
- Python backend (`back_python/`) — modèle SQLAlchemy + migration Alembic + endpoint FastAPI + slowapi rate limiter + tests pytest

### Hors scope
- CAPTCHA / anti-spam
- Notifications email ou webhook
- Lecture/non-lu, marquage des messages
- Suppression de messages depuis l'admin
- Pagination (liste simple)
- Token statique / middleware `adminTokenMiddleware` (remplacé par JWT + requireAdmin)

---

## Plan fonctionnel

### Backend
1. Ajouter le modèle `ContactMessage` au schéma Prisma et générer la migration
2. Ajouter `contactLimiter` dans `rateLimiterMiddleware.ts` (20 req / 10 min par IP)
3. Créer la route `/api/contact` avec :
   - `POST /` — public, rate-limité, valide avec Zod, persiste en DB, retourne 201
   - `GET /` — `authenticateToken` + `requireAdmin`, retourne la liste triée par `createdAt` desc
4. Tests d'intégration : POST validation, POST rate-limit, GET sans auth (401), GET user non-admin (403), GET admin (200)

### Frontend (×3 : Vue, React, Angular)
5. Service `contactService` — `sendMessage(data)` + `getMessages()`
6. Page `/contact` (PublicLayout) — formulaire avec validation front (name requis, email format, message requis), feedback succès inline + reset, lien dans nav publique
7. Page `/backoffice/messages` (AdminLayout, guard `requiresAdmin`) — liste tronquée, modale pour message complet, lien dans nav backoffice

---

## Règles / Contraintes
- Utiliser `authenticateToken` + `requireAdmin` existants pour `GET /api/contact` — pas de nouveau middleware auth
- `contactLimiter` ajouté dans le fichier existant `rateLimiterMiddleware.ts`
- Imports Prisma depuis `generated/prisma_client` (pas `@prisma/client`)
- Suivre les patterns existants : Router Express, Zod schema, structure des routes
- Tests d'intégration dans `back/src/__tests__/integration/contact.test.ts`
- Ne pas modifier de code non lié à la feature

---

## Hypothèses
- La migration Prisma est appliquée via Docker (`docker-compose exec api npx prisma migrate dev`)
- La page `/backoffice/messages` utilise les guards `requiresAuth` + `requiresAdmin` existants dans les frontends
- La page `/contact` utilise PublicLayout (cohérent avec HomeView, ShowsView)

---

## Questions ouvertes
- _(aucune bloquante — les choix clés ont été confirmés par l'utilisateur)_

---

## Backlog

| # | Titre | Domaine | Estimation | Dépendances |
|---|-------|---------|-----------|-------------|
| T1 | [Back] Modèle Prisma `ContactMessage` + migration | Backend | 1h | — |
| T2 | [Back] Route `POST /api/contact` + `GET /api/contact` + `contactLimiter` + tests | Backend | 2h | T1 |
| T3 | [Vue] Page `/contact` + `contactService` + lien nav | Frontend Vue | 2h | T2 |
| T4 | [Vue] Page `/backoffice/messages` + modale + lien nav backoffice | Frontend Vue | 1.5h | T2 |
| T5 | [React] Page `/contact` + `contactService` + lien nav | Frontend React | 2h | T2 |
| T6 | [React] Page `/backoffice/messages` + modale + lien nav backoffice | Frontend React | 1.5h | T2 |
| T7 | [Angular] Page `/contact` + `contact.service` + lien nav | Frontend Angular | 2h | T2 |
| T8 | [Angular] Page `/backoffice/messages` + modale + lien nav backoffice | Frontend Angular | 1.5h | T2 |
| T9 | [Python] Modèle SQLAlchemy `ContactMessage` + migration Alembic | Backend Python | 1h | — |
| T10 | [Python] Route `POST /api/contact` + `GET /api/contact` + slowapi limiter + tests | Backend Python | 2h | T9 |

**Total estimé : ~16.5h**  
**Epic requis** : oui (10 tâches, 3 domaines techniques, 5 sous-systèmes)
