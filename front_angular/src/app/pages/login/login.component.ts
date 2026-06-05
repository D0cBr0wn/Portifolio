import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/stores/auth.store';

type Step = 'credentials' | 'mfa' | 'mfa-setup';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <mat-card-content>
          <h2 class="card-title" data-testid="login-title">{{ stepTitle() }}</h2>

          @if (step() === 'credentials') {
            <form (ngSubmit)="submitCredentials()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" name="email" [(ngModel)]="email"
                       required autocomplete="email" data-testid="email-input" />
                @if (emailError()) { <mat-error>{{ emailError() }}</mat-error> }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mot de passe</mat-label>
                <input matInput [type]="showPassword() ? 'text' : 'password'"
                       name="password" [(ngModel)]="password"
                       required autocomplete="current-password" data-testid="password-input" />
                <button mat-icon-button matSuffix type="button"
                        (click)="showPassword.set(!showPassword())">
                  <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (passwordError()) { <mat-error>{{ passwordError() }}</mat-error> }
              </mat-form-field>

              @if (serverError()) {
                <div class="error-msg" data-testid="server-error">{{ serverError() }}</div>
              }

              <button mat-raised-button color="primary" type="submit"
                      class="full-width submit-btn" [disabled]="loading()"
                      data-testid="login-submit">
                @if (loading()) { <mat-spinner diameter="22" /> } @else { Se connecter }
              </button>
            </form>
          }

          @if (step() === 'mfa-setup') {
            <form (ngSubmit)="submitMfaSetup()">
              @if (!qrCodeDataURL()) {
                <p class="hint">Votre administrateur a activé le MFA. Chargement du QR code…</p>
                <mat-spinner style="margin: auto" />
              } @else {
                <p class="hint" data-testid="mfa-hint">Scannez ce QR code avec Google Authenticator ou une app TOTP, puis entrez le code généré.</p>
                <div class="qr-wrapper">
                  <img [src]="qrCodeDataURL()" alt="QR Code MFA" width="180" height="180" />
                </div>
                <mat-form-field appearance="outline" class="full-width otp-field">
                  <mat-label>Code à 6 chiffres</mat-label>
                  <input matInput name="mfaSetupCode" [(ngModel)]="mfaSetupCode"
                         inputmode="numeric" maxlength="6"
                         (input)="filterDigits('setup')" #setupInput data-testid="otp-input" />
                </mat-form-field>
                @if (serverError()) { <div class="error-msg" data-testid="server-error">{{ serverError() }}</div> }
                <button mat-raised-button color="primary" type="submit"
                        class="full-width submit-btn"
                        [disabled]="loading() || mfaSetupCode.length < 6"
                        data-testid="mfa-submit">
                  @if (loading()) { <mat-spinner diameter="22" /> } @else { Confirmer }
                </button>
              }
            </form>
          }

          @if (step() === 'mfa') {
            <form (ngSubmit)="submitMfa()">
              <p class="hint" data-testid="mfa-hint">Saisissez le code à 6 chiffres de votre application Google Authenticator.</p>
              <mat-form-field appearance="outline" class="full-width otp-field">
                <mat-label>Code à 6 chiffres</mat-label>
                <input matInput name="mfaCode" [(ngModel)]="mfaCode"
                       inputmode="numeric" maxlength="6"
                       (input)="filterDigits('mfa')" #mfaInput data-testid="otp-input" />
              </mat-form-field>
              @if (serverError()) { <div class="error-msg" data-testid="server-error">{{ serverError() }}</div> }
              <button mat-raised-button color="primary" type="submit"
                      class="full-width submit-btn"
                      [disabled]="loading() || mfaCode.length < 6"
                      data-testid="mfa-submit">
                @if (loading()) { <mat-spinner diameter="22" /> } @else { Vérifier }
              </button>
              <button mat-button type="button" class="full-width"
                      (click)="step.set('credentials')">Retour</button>
            </form>
          }

          <div class="register-link">
            <a routerLink="/register">Créer un compte (démo)</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #1a1a1a;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background: #2a2a2a !important;
      color: #e0e0e0;
    }

    .login-card ::ng-deep .mat-mdc-form-field-input-control,
    .login-card ::ng-deep .mat-mdc-floating-label,
    .login-card ::ng-deep .mdc-text-field__input {
      color: #e0e0e0 !important;
    }

    .login-card ::ng-deep .mat-mdc-floating-label:not(.mdc-floating-label--float-above) {
      color: #aaa !important;
    }

    .login-card ::ng-deep .mdc-notched-outline__leading,
    .login-card ::ng-deep .mdc-notched-outline__notch,
    .login-card ::ng-deep .mdc-notched-outline__trailing {
      border-color: rgba(255, 255, 255, 0.3) !important;
    }

    .login-card ::ng-deep .mdc-text-field--focused .mdc-notched-outline__leading,
    .login-card ::ng-deep .mdc-text-field--focused .mdc-notched-outline__notch,
    .login-card ::ng-deep .mdc-text-field--focused .mdc-notched-outline__trailing {
      border-color: #bb86fc !important;
    }

    .login-card ::ng-deep .mdc-text-field--focused .mat-mdc-floating-label {
      color: #bb86fc !important;
    }

    .card-title {
      font-weight: 400;
      color: #bb86fc;
      margin: 0 0 1.5rem;
      font-size: 1.4rem;
    }

    .full-width { width: 100%; }

    .submit-btn {
      margin-top: 0.5rem;
      height: 48px;
    }

    .hint {
      color: #aaa;
      font-size: 0.9rem;
      margin: 0 0 1rem;
    }

    .qr-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .otp-field ::ng-deep input {
      text-align: center;
      font-size: 1.5rem;
      letter-spacing: 0.5em;
    }

    .error-msg {
      color: #cf6679;
      border: 1px solid #cf6679;
      border-radius: 4px;
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .register-link {
      text-align: center;
      margin-top: 1rem;

      a {
        font-size: 0.75rem;
        color: #888;
        text-decoration: none;
        &:hover { color: #aaa; }
      }
    }
  `],
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('mfaInput') mfaInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('setupInput') setupInputRef?: ElementRef<HTMLInputElement>;

  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal<Step>('credentials');
  readonly loading = signal(false);
  readonly serverError = signal('');
  readonly showPassword = signal(false);
  readonly qrCodeDataURL = signal('');
  readonly emailError = signal('');
  readonly passwordError = signal('');

  email = '';
  password = '';
  mfaCode = '';
  mfaSetupCode = '';

  private pendingSetupToken = '';
  private pendingUserId: number | null = null;

  readonly stepTitle = () => {
    const s = this.step();
    if (s === 'mfa') return 'Vérification MFA';
    if (s === 'mfa-setup') return 'Configuration MFA';
    return 'Connexion';
  };

  constructor() {
    effect(() => {
      const s = this.step();
      setTimeout(() => {
        if (s === 'mfa') this.mfaInputRef?.nativeElement.focus();
        if (s === 'mfa-setup') this.setupInputRef?.nativeElement.focus();
      }, 50);
    });
  }

  ngAfterViewInit(): void {}

  private redirectAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    const target = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/backoffice/venues';
    this.router.navigateByUrl(target);
  }

  filterDigits(target: 'mfa' | 'setup'): void {
    if (target === 'mfa') {
      this.mfaCode = this.mfaCode.replace(/\D/g, '').slice(0, 6);
    } else {
      this.mfaSetupCode = this.mfaSetupCode.replace(/\D/g, '').slice(0, 6);
    }
  }

  submitCredentials(): void {
    this.emailError.set(this.email ? '' : "L'email est requis");
    this.passwordError.set(this.password ? '' : 'Le mot de passe est requis');
    if (this.emailError() || this.passwordError()) return;

    this.loading.set(true);
    this.serverError.set('');
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.mfaSetupRequired && res.setupToken) {
          this.pendingSetupToken = res.setupToken;
          this.step.set('mfa-setup');
          this.authService.setupMfaWithToken(res.setupToken).subscribe({
            next: (setup) => this.qrCodeDataURL.set(setup.qrCodeDataURL),
          });
        } else if (res.mfaRequired && res.userId) {
          this.pendingUserId = res.userId;
          this.step.set('mfa');
        } else if (res.token) {
          this.authStore.setToken(res.token);
          this.redirectAfterLogin();
        }
      },
      error: () => {
        this.serverError.set('Identifiants invalides.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  submitMfaSetup(): void {
    if (!this.pendingSetupToken || this.mfaSetupCode.length < 6) return;
    this.loading.set(true);
    this.serverError.set('');
    this.authService.confirmMfaWithToken(this.mfaSetupCode, this.pendingSetupToken).subscribe({
      next: (res) => {
        this.authStore.setToken(res.token);
        this.router.navigate(['/backoffice/venues']);
      },
      error: () => {
        this.serverError.set('Code invalide. Réessayez.');
        this.mfaSetupCode = '';
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  submitMfa(): void {
    if (!this.pendingUserId || this.mfaCode.length < 6) return;
    this.loading.set(true);
    this.serverError.set('');
    this.authService.verifyMfa(this.pendingUserId, this.mfaCode).subscribe({
      next: (res) => {
        this.authStore.setToken(res.token);
        this.router.navigate(['/backoffice/venues']);
      },
      error: () => {
        this.serverError.set('Code invalide. Réessayez.');
        this.mfaCode = '';
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
