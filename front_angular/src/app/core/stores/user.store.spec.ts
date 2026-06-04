import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserStore } from './user.store';
import { UserService } from '../services/user.service';
import type { UserData } from '@portfolio/shared';

const makeUser = (id: number, role: 'USER' | 'ADMIN' = 'USER'): UserData => ({
  id, email: `user${id}@test.com`, role, mfaEnabled: false, createdAt: '2025-01-01',
});

describe('UserStore', () => {
  let store: UserStore;
  let userService: jest.Mocked<UserService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserStore,
        {
          provide: UserService,
          useValue: {
            getAll: jest.fn(), getById: jest.fn(), updateRole: jest.fn(),
            updatePassword: jest.fn(), requireMfa: jest.fn(), disableMfa: jest.fn(), remove: jest.fn(),
          },
        },
      ],
    });
    store = TestBed.inject(UserStore);
    userService = TestBed.inject(UserService) as jest.Mocked<UserService>;
  });

  it('état initial : users vide, loading false, error null', () => {
    expect(store.users()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('load() charge les utilisateurs', () => {
    userService.getAll.mockReturnValue(of([makeUser(1)]));
    store.load();
    expect(store.users()).toHaveLength(1);
    expect(store.loading()).toBe(false);
  });

  it('load() définit error en cas d\'échec', () => {
    userService.getAll.mockReturnValue(throwError(() => new Error('fail')));
    store.load();
    expect(store.error()).toBeTruthy();
  });

  it('loadOne() charge un utilisateur dans currentUser', () => {
    userService.getById.mockReturnValue(of(makeUser(3)));
    store.loadOne(3);
    expect(store.currentUser()?.id).toBe(3);
  });

  it('updateRole() met à jour le rôle dans la liste et currentUser', async () => {
    const user = makeUser(1);
    store.users.set([user]);
    store.currentUser.set(user);
    const updated = { ...user, role: 'ADMIN' as const };
    userService.updateRole.mockReturnValue(of(updated));
    await store.updateRole(1, 'ADMIN');
    expect(store.users()[0].role).toBe('ADMIN');
    expect(store.currentUser()?.role).toBe('ADMIN');
  });

  it('remove() retire l\'utilisateur de la liste', async () => {
    store.users.set([makeUser(1), makeUser(2)]);
    userService.remove.mockReturnValue(of(undefined as unknown as void));
    await store.remove(1);
    expect(store.users().find((u) => u.id === 1)).toBeUndefined();
  });
});
