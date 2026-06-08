# Fix: Angular auth guard non exécuté sur /backoffice/venues

## Context

Accéder à `/backoffice/venues` sans être connecté n'effectue pas de redirection vers `/login`. L'utilisateur reste sur la page et voit une erreur 401.

**Root cause :** Dans `app.routes.ts`, les guards sont chargés avec un pattern de lazy-loading incorrect :

```typescript
// Code actuel (bugué)
canActivate: [() => import('./core/guards/auth.guard').then((m) => m.authGuard)]
```

Angular traite cette arrow function comme une `CanActivateFn`. Elle retourne une `Promise<CanActivateFn>` — c'est-à-dire une promesse qui résout vers la *référence de la fonction guard*, pas le résultat de son appel. Angular attend la promesse, obtient la fonction `authGuard` (qui est truthy), l'évalue comme `true`, et autorise la navigation sans jamais appeler le guard.

## Fix

**Fichier unique à modifier :** `front_angular/src/app/app.routes.ts`

Remplacer les imports lazy des trois guards par des imports directs en tête de fichier, puis utiliser les références de fonctions directement dans les routes.

```typescript
// Avant (bugué — lazy-loading incorrect)
canActivate: [() => import('./core/guards/auth.guard').then((m) => m.authGuard)],
canActivate: [() => import('./core/guards/guest.guard').then((m) => m.guestGuard)],
canActivate: [() => import('./core/guards/admin.guard').then((m) => m.adminGuard)],

// Après (correct)
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

canActivate: [authGuard],
canActivate: [guestGuard],
canActivate: [adminGuard],
```

Les guards sont de petits fichiers utilitaires — le lazy-loading ne leur apporte aucun bénéfice et est ici la cause du bug.

## Fichiers concernés

- `front_angular/src/app/app.routes.ts` — seul fichier à modifier

## Vérification

1. Naviguer vers `/backoffice/venues` sans être connecté → doit rediriger vers `/login?returnUrl=/backoffice/venues`
2. Se connecter → doit rediriger vers `/backoffice/venues`
3. Naviguer vers `/login` en étant connecté → doit rediriger vers `/backoffice/venues` (guestGuard)
4. Se connecter en tant que non-admin et tenter `/backoffice/users` → doit rediriger vers `/backoffice/venues` (adminGuard)

## Backlog

| # | Tâche | Durée estimée | Dépendances |
|---|-------|---------------|-------------|
| 1 | Fix guards lazy-loading dans app.routes.ts | ~30 min | — |

> Une seule PR : `fix/angular-auth-guard` → `dev`
