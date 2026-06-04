import { Injectable, signal, computed } from '@angular/core';

function decodeIsAdmin(token: string): boolean {
  try {
    return JSON.parse(atob(token.split('.')[1])).role === 'ADMIN';
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _token = signal<string | null>(sessionStorage.getItem('token'));

  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => {
    const t = this._token();
    return t ? decodeIsAdmin(t) : false;
  });

  setToken(token: string): void {
    sessionStorage.setItem('token', token);
    this._token.set(token);
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this._token.set(null);
  }
}
