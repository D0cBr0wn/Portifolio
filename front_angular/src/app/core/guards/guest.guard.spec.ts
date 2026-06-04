import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
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

  it('retourne true si non authentifié (accès guest autorisé)', () => {
    mockAuth.isAuthenticated.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() => guestGuard());
    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('redirige vers /backoffice/venues si déjà authentifié', () => {
    mockAuth.isAuthenticated.mockReturnValue(true);
    const result = TestBed.runInInjectionContext(() => guestGuard());
    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/backoffice/venues']);
  });
});
