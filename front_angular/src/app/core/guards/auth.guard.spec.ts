import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '../stores/auth.store';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let mockAuth: { isAuthenticated: jest.Mock; isAdmin: jest.Mock; token: jest.Mock };
  let mockRouter: { navigate: jest.Mock };

  beforeEach(() => {
    mockAuth = { isAuthenticated: jest.fn(), isAdmin: jest.fn().mockReturnValue(false), token: jest.fn().mockReturnValue(null) };
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('retourne true si authentifié', () => {
    mockAuth.isAuthenticated.mockReturnValue(true);
    const mockState = { url: '/protected' } as RouterStateSnapshot;
    const result = TestBed.runInInjectionContext(() => authGuard(undefined, mockState));
    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('redirige vers /login si non authentifié', () => {
    mockAuth.isAuthenticated.mockReturnValue(false);
    const mockState = { url: '/protected' } as RouterStateSnapshot;
    const result = TestBed.runInInjectionContext(() => authGuard(undefined, mockState));
    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/protected' } });
  });
});
