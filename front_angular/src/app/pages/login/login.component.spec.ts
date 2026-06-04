import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/stores/auth.store';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    const authServiceMock = { login: jest.fn(), verifyMfa: jest.fn(), setupMfaWithToken: jest.fn(), confirmMfaWithToken: jest.fn(), setupMfa: jest.fn(), confirmMfa: jest.fn(), register: jest.fn() };
    const authStoreMock = { setToken: jest.fn(), logout: jest.fn(), isAuthenticated: jest.fn().mockReturnValue(false), isAdmin: jest.fn().mockReturnValue(false), token: jest.fn().mockReturnValue(null) };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: AuthStore, useValue: authStoreMock },
      ],
    });
    fixture = TestBed.createComponent(LoginComponent);
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    fixture.detectChanges();
  });

  it('affiche le titre "Connexion" initialement', () => {
    expect(fixture.nativeElement.textContent).toContain('Connexion');
  });

  it('affiche les champs email et mot de passe', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    const types = Array.from(inputs).map((i) => i.type);
    expect(types).toContain('email');
    expect(types).toContain('password');
  });

  it('affiche les erreurs si champs vides à la soumission', () => {
    fixture.componentInstance.submitCredentials();
    fixture.detectChanges();
    expect(fixture.componentInstance.emailError()).toBeTruthy();
    expect(fixture.componentInstance.passwordError()).toBeTruthy();
  });

  it('affiche l\'étape MFA après une réponse mfaRequired', async () => {
    authService.login.mockReturnValue(of({ mfaRequired: true, userId: 42 }));
    fixture.componentInstance.email = 'a@b.com';
    fixture.componentInstance.password = 'pass';
    await fixture.componentInstance.submitCredentials();
    fixture.detectChanges();
    expect(fixture.componentInstance.step()).toBe('mfa');
    expect(fixture.nativeElement.textContent).toContain('Vérification MFA');
  });

  it('affiche une erreur serveur sur identifiants invalides', async () => {
    authService.login.mockReturnValue(throwError(() => new Error('401')));
    fixture.componentInstance.email = 'a@b.com';
    fixture.componentInstance.password = 'wrong';
    await fixture.componentInstance.submitCredentials();
    fixture.detectChanges();
    expect(fixture.componentInstance.serverError()).toBeTruthy();
  });
});
