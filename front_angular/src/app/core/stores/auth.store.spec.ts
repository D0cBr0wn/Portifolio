import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';

const ADMIN_TOKEN = 'h.' + btoa(JSON.stringify({ role: 'ADMIN' })) + '.s';
const USER_TOKEN  = 'h.' + btoa(JSON.stringify({ role: 'USER'  })) + '.s';

describe('AuthStore', () => {
  let store: AuthStore;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [AuthStore] });
    store = TestBed.inject(AuthStore);
  });

  it('état initial : token null, non authentifié, non admin', () => {
    expect(store.token()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isAdmin()).toBe(false);
  });

  it('setToken() définit le token et passe isAuthenticated à true', () => {
    store.setToken(USER_TOKEN);
    expect(store.token()).toBe(USER_TOKEN);
    expect(store.isAuthenticated()).toBe(true);
  });

  it('setToken() détecte le rôle ADMIN', () => {
    store.setToken(ADMIN_TOKEN);
    expect(store.isAdmin()).toBe(true);
  });

  it('setToken() laisse isAdmin à false pour USER', () => {
    store.setToken(USER_TOKEN);
    expect(store.isAdmin()).toBe(false);
  });

  it('setToken() sauvegarde dans sessionStorage', () => {
    store.setToken(USER_TOKEN);
    expect(sessionStorage.getItem('token')).toBe(USER_TOKEN);
  });

  it('logout() réinitialise le token et vide sessionStorage', () => {
    store.setToken(USER_TOKEN);
    store.logout();
    expect(store.token()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('token')).toBeNull();
  });
});
