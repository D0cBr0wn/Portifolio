import { inject } from '@angular/core';
import { Router, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export function authGuard(_: unknown, state: RouterStateSnapshot): boolean {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
}
