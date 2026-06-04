import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let mockAuth: { isAuthenticated: jest.Mock; isAdmin: jest.Mock; token: jest.Mock };
  let mockRouter: { navigate: jest.Mock };

  beforeEach(() => {
    mockAuth = { isAuthenticated: jest.fn().mockReturnValue(true), isAdmin: jest.fn(), token: jest.fn().mockReturnValue(null) };
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('retourne true si admin', () => {
    mockAuth.isAdmin.mockReturnValue(true);
    const result = TestBed.runInInjectionContext(() => adminGuard());
    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('redirige vers /backoffice/venues si non admin', () => {
    mockAuth.isAdmin.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() => adminGuard());
    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/backoffice/venues']);
  });
});
