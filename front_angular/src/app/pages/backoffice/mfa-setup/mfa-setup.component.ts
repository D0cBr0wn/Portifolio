import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminLayoutComponent } from '../../../layout/admin/admin-layout.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/stores/auth.store';

type Step = 'init' | 'qr' | 'done';

@Component({
  selector: 'app-mfa-setup',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    AdminLayoutComponent,
  ],
  template: `
    <app-admin-layout>
      <h1 class="page-title">Sécurité — Authentification MFA</h1>

      @if (step() === 'init') {
        <mat-card class="mfa-card">
          <mat-card-content>
            <p>Activez l'authentification à deux facteurs (TOTP) pour sécuriser votre compte.
               Vous aurez besoin de l'application <strong>Google Authenticator</strong> ou équivalente.</p>
            @if (error()) { <div class="error-msg">{{ error() }}</div> }
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="startSetup()" [disabled]="loading()">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Activer le MFA }
            </button>
          </mat-card-actions>
        </mat-card>
      }

      @if (step() === 'qr') {
        <mat-card class="mfa-card">
          <mat-card-content>
            <p>Scannez ce QR code avec votre application d'authentification :</p>
            <div class="qr-wrapper">
              <img [src]="qrCodeDataURL()" alt="QR code MFA" width="200" height="200" />
            </div>
            <p class="secret-hint">Code manuel : <code>{{ secret() }}</code></p>
            <p>Entrez le code à 6 chiffres pour confirmer :</p>
            <mat-form-field appearance="outline" class="otp-field">
              <mat-label>Code à 6 chiffres</mat-label>
              <input matInput name="otpCode" [(ngModel)]="otpCode"
                     inputmode="numeric" maxlength="6"
                     (input)="filterDigits()" />
            </mat-form-field>
            @if (error()) { <div class="error-msg">{{ error() }}</div> }
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="step.set('init')">Annuler</button>
            <button mat-raised-button color="primary"
                    (click)="confirmSetup()"
                    [disabled]="loading() || otpCode.length < 6">
              @if (loading()) { <mat-spinner diameter="20" /> } @else { Confirmer }
            </button>
          </mat-card-actions>
        </mat-card>
      }

      @if (step() === 'done') {
        <mat-card class="mfa-card">
          <mat-card-content>
            <div class="success-msg">
              MFA activé avec succès ! Votre compte est désormais protégé par un second facteur.
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="router.navigate(['/backoffice/venues'])">
              Retour au backoffice
            </button>
          </mat-card-actions>
        </mat-card>
      }
    </app-admin-layout>
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 400; margin: 0 0 1.5rem; }

    .mfa-card { max-width: 480px; }

    .qr-wrapper {
      display: flex;
      justify-content: center;
      margin: 1rem 0;
    }

    .secret-hint {
      color: #aaa;
      font-size: 0.85rem;
      code { background: #333; padding: 2px 4px; border-radius: 3px; }
    }

    .otp-field {
      width: 100%;
      ::ng-deep input {
        text-align: center;
        font-size: 1.4rem;
        letter-spacing: 0.5em;
      }
    }

    .error-msg {
      color: #cf6679;
      border: 1px solid #cf6679;
      border-radius: 4px;
      padding: 0.5rem 0.75rem;
      margin: 0.5rem 0;
    }

    .success-msg {
      background: rgba(129, 199, 132, 0.15);
      border: 1px solid #81c784;
      color: #81c784;
      border-radius: 4px;
      padding: 0.75rem;
    }
  `],
})
export class MfaSetupComponent {
  protected readonly step = signal<Step>('init');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly qrCodeDataURL = signal('');
  protected readonly secret = signal('');

  protected otpCode = '';

  protected readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);

  filterDigits(): void {
    this.otpCode = this.otpCode.replace(/\D/g, '').slice(0, 6);
  }

  startSetup(): void {
    this.loading.set(true);
    this.error.set('');
    this.authService.setupMfa().subscribe({
      next: (res) => {
        this.qrCodeDataURL.set(res.qrCodeDataURL);
        this.secret.set(res.secret);
        this.step.set('qr');
      },
      error: (e: Error) => {
        this.error.set(e.message || "Erreur lors de l'activation du MFA.");
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  confirmSetup(): void {
    if (this.otpCode.length < 6) return;
    this.loading.set(true);
    this.error.set('');
    this.authService.confirmMfa(this.otpCode).subscribe({
      next: (res) => {
        if (res.verified) {
          this.authStore.setToken(res.token);
          this.step.set('done');
        }
      },
      error: (e: Error) => {
        this.error.set(e.message || 'Code invalide. Réessayez.');
        this.otpCode = '';
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
