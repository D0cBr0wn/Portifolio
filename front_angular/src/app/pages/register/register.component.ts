import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="register-wrapper">
      <mat-card class="register-card">
        <mat-card-content>
          <h2 class="card-title">Créer un compte</h2>

          <div class="demo-warning">
            Cette page est disponible <strong>uniquement pour la démonstration</strong>.<br />
            Elle n'existe pas en production.
          </div>

          @if (success()) {
            <div class="success-msg">Compte créé avec succès ! Vous pouvez maintenant vous connecter.</div>
            <a mat-raised-button color="primary" routerLink="/login" class="full-width">Se connecter</a>
          } @else {
            <form (ngSubmit)="submit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" name="email" [(ngModel)]="email"
                       required autocomplete="email" />
                @if (emailError()) { <mat-error>{{ emailError() }}</mat-error> }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mot de passe</mat-label>
                <input matInput [type]="showPassword() ? 'text' : 'password'"
                       name="password" [(ngModel)]="password"
                       required autocomplete="new-password" />
                <button mat-icon-button matSuffix type="button"
                        (click)="showPassword.set(!showPassword())">
                  <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (passwordError()) { <mat-error>{{ passwordError() }}</mat-error> }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirmer le mot de passe</mat-label>
                <input matInput [type]="showConfirm() ? 'text' : 'password'"
                       name="confirm" [(ngModel)]="confirm"
                       required autocomplete="new-password" />
                <button mat-icon-button matSuffix type="button"
                        (click)="showConfirm.set(!showConfirm())">
                  <mat-icon>{{ showConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (confirmError()) { <mat-error>{{ confirmError() }}</mat-error> }
              </mat-form-field>

              <mat-checkbox [(ngModel)]="isAdmin" name="isAdmin" color="warn" class="admin-check">
                Créer en tant qu'<strong>ADMIN</strong>
                <span class="admin-hint">(démo uniquement)</span>
              </mat-checkbox>

              @if (serverError()) {
                <div class="error-msg">{{ serverError() }}</div>
              }

              <button mat-raised-button color="primary" type="submit"
                      class="full-width submit-btn" [disabled]="loading()">
                @if (loading()) { <mat-spinner diameter="22" /> } @else { Créer le compte }
              </button>
            </form>
          }

          <div class="login-link">
            <a routerLink="/login">Déjà un compte ? Se connecter</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #1a1a1a;
    }

    .register-card {
      width: 100%;
      max-width: 420px;
    }

    .card-title {
      font-weight: 400;
      color: #bb86fc;
      margin: 0 0 1.5rem;
      font-size: 1.4rem;
    }

    .demo-warning {
      border: 1px solid #ffb74d;
      color: #ffb74d;
      border-radius: 4px;
      padding: 0.75rem;
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .full-width { width: 100%; }

    .admin-check {
      display: block;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .admin-hint {
      font-size: 0.75rem;
      color: #888;
      margin-left: 0.25rem;
    }

    .submit-btn {
      margin-top: 0.5rem;
      height: 48px;
    }

    .error-msg {
      color: #cf6679;
      border: 1px solid #cf6679;
      border-radius: 4px;
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .success-msg {
      background: rgba(129, 199, 132, 0.15);
      border: 1px solid #81c784;
      color: #81c784;
      border-radius: 4px;
      padding: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .login-link {
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
export class RegisterComponent {
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly serverError = signal('');
  readonly success = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);
  readonly emailError = signal('');
  readonly passwordError = signal('');
  readonly confirmError = signal('');

  email = '';
  password = '';
  confirm = '';
  isAdmin = false;

  submit(): void {
    this.emailError.set(this.email ? '' : "L'email est requis");
    this.passwordError.set(
      !this.password ? 'Le mot de passe est requis' :
      this.password.length < 6 ? 'Minimum 6 caractères' : ''
    );
    this.confirmError.set(
      this.password !== this.confirm ? 'Les mots de passe ne correspondent pas' : ''
    );
    if (this.emailError() || this.passwordError() || this.confirmError()) return;

    this.loading.set(true);
    this.serverError.set('');
    this.authService.register(this.email, this.password, this.isAdmin).subscribe({
      next: () => this.success.set(true),
      error: (e: Error) => {
        this.serverError.set(e.message || 'Erreur lors de la création du compte.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
