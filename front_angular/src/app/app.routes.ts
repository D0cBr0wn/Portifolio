import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'shows',
    loadComponent: () =>
      import('./pages/shows/shows.component').then((m) => m.ShowsComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'backoffice',
    canActivate: [authGuard],
    children: [
      {
        path: 'venues',
        loadComponent: () =>
          import('./pages/backoffice/venues/venues.component').then((m) => m.VenuesComponent),
      },
      {
        path: 'shows',
        loadComponent: () =>
          import('./pages/backoffice/shows/shows.component').then((m) => m.BackofficeShowsComponent),
      },
      {
        path: 'mfa-setup',
        loadComponent: () =>
          import('./pages/backoffice/mfa-setup/mfa-setup.component').then((m) => m.MfaSetupComponent),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/backoffice/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'users/:id',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/backoffice/user-detail/user-detail.component').then((m) => m.UserDetailComponent),
      },
      {
        path: 'messages',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/backoffice/messages/messages.component').then((m) => m.BackofficeMessagesComponent),
      },
      { path: '', redirectTo: 'venues', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
