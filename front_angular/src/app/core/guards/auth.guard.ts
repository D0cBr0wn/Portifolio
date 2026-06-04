import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export function authGuard(): boolean {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/login']);
  return false;
}
