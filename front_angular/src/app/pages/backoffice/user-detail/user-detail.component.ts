import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminLayoutComponent } from '../../../layout/admin/admin-layout.component';
import { UserStore } from '../../../core/stores/user.store';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatListModule,
    MatSnackBarModule,
    AdminLayoutComponent,
  ],
  template: `
    <app-admin-layout>
      <div class="page-header">
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon> Retour
        </button>
        <h1 class="page-title">Gestion utilisateur</h1>
      </div>

      @if (store.error()) {
        <div class="error-msg">{{ store.error() }}</div>
      }

      @if (store.loading() && !store.currentUser()) {
        <mat-progress-bar mode="indeterminate" color="primary" class="loading-bar" />
      }

      @if (store.currentUser(); as user) {
        <!-- Informations -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>Informations</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">{{ user.email }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Inscrit le</span>
                <span class="info-value">{{ fmtDate(user.createdAt) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Rôle</span>
                <span class="role-chip" [class.role-admin]="user.role === 'ADMIN'">{{ user.role }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">MFA</span>
                <span class="mfa-status">
                  <mat-icon [class.mfa-on]="user.mfaEnabled" [class.mfa-off]="!user.mfaEnabled">
                    {{ user.mfaEnabled ? 'shield' : 'shield_off' }}
                  </mat-icon>
                  {{ user.mfaEnabled ? 'Activé' : 'Non configuré' }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Modifier le rôle -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>Modifier le rôle</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="role-select">
              <mat-label>Rôle</mat-label>
              <mat-select [(ngModel)]="selectedRole">
                <mat-option value="USER">USER</mat-option>
                <mat-option value="ADMIN">ADMIN</mat-option>
              </mat-select>
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary"
                    [disabled]="selectedRole() === user.role || store.loading()"
                    (click)="handleUpdateRole()">
              Enregistrer
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Modifier le mot de passe -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>Modifier le mot de passe</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="password-field">
              <mat-label>Nouveau mot de passe</mat-label>
              <input matInput
                     [type]="showPassword() ? 'text' : 'password'"
                     [(ngModel)]="newPassword" />
              <button matSuffix mat-icon-button (click)="togglePassword()">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary"
                    [disabled]="newPassword().length < 6 || store.loading()"
                    (click)="handleUpdatePassword()">
              Modifier
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- MFA -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>Authentification multi-facteurs</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="mfa-description">
              @if (user.mfaEnabled) {
                Le MFA est actif. Désactiver forcera l'utilisateur à reconfigurer son authenticator s'il est remis en place.
              } @else {
                Forcer le MFA : l'utilisateur devra configurer son authenticator à sa prochaine connexion.
              }
            </p>
          </mat-card-content>
          <mat-card-actions>
            @if (!user.mfaEnabled) {
              <button mat-stroked-button color="accent"
                      [disabled]="store.loading()"
                      (click)="handleRequireMfa()">
                Forcer le MFA
              </button>
            } @else {
              <button mat-stroked-button color="warn"
                      [disabled]="store.loading()"
                      (click)="handleDisableMfa()">
                Désactiver le MFA
              </button>
            }
          </mat-card-actions>
        </mat-card>
      }
    </app-admin-layout>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .page-title { font-size: 1.5rem; font-weight: 400; margin: 0; }

    .loading-bar { margin-bottom: 1rem; }

    .error-msg {
      color: #cf6679;
      border: 1px solid #cf6679;
      border-radius: 4px;
      padding: 0.75rem;
      margin-bottom: 1rem;
    }

    .section-card {
      max-width: 600px;
      margin-bottom: 1.25rem;
    }

    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding-top: 0.5rem;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .info-label {
      width: 100px;
      font-size: 0.8rem;
      color: rgba(0,0,0,0.6);
      flex-shrink: 0;
    }

    .info-value { font-size: 0.95rem; }

    .role-chip {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      background: rgba(0,0,0,0.08);
      color: rgba(0,0,0,0.6);

      &.role-admin {
        background: rgba(98, 0, 238, 0.15);
        color: #6200EE;
      }
    }

    .mfa-status {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.95rem;
    }

    .mfa-on { color: #4caf50; font-size: 18px; }
    .mfa-off { color: #555; font-size: 18px; }

    .role-select { width: 200px; }
    .password-field { width: 300px; }

    .mfa-description {
      font-size: 0.875rem;
      color: rgba(0,0,0,0.6);
      margin: 0.5rem 0 0;
    }

    mat-card-actions {
      padding: 0.5rem 1rem 1rem;
    }
  `],
})
export class UserDetailComponent implements OnInit {
  protected readonly store = inject(UserStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly fmtDate = formatDate;
  protected readonly selectedRole = signal<'USER' | 'ADMIN'>('USER');
  protected readonly newPassword = signal('');
  protected readonly showPassword = signal(false);

  ngOnInit(): void {
    const id = parseInt(String(this.route.snapshot.paramMap.get('id')), 10);
    this.store.loadOne(id);
    const user = this.store.currentUser();
    if (user) this.selectedRole.set(user.role);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  goBack(): void {
    this.router.navigate(['/backoffice/users']);
  }

  private notify(message: string): void {
    this.snackBar.open(message, undefined, { duration: 3000, horizontalPosition: 'right', verticalPosition: 'bottom' });
  }

  async handleUpdateRole(): Promise<void> {
    const user = this.store.currentUser();
    if (!user) return;
    await this.store.updateRole(user.id, this.selectedRole());
    if (!this.store.error()) this.notify('Rôle mis à jour.');
  }

  async handleUpdatePassword(): Promise<void> {
    const user = this.store.currentUser();
    if (!user) return;
    await this.store.updatePassword(user.id, this.newPassword());
    if (!this.store.error()) {
      this.newPassword.set('');
      this.notify('Mot de passe modifié.');
    }
  }

  async handleRequireMfa(): Promise<void> {
    const user = this.store.currentUser();
    if (!user) return;
    await this.store.requireMfa(user.id);
    if (!this.store.error()) this.notify("MFA activé — l'utilisateur devra le configurer à sa prochaine connexion.");
  }

  async handleDisableMfa(): Promise<void> {
    const user = this.store.currentUser();
    if (!user) return;
    await this.store.disableMfa(user.id);
    if (!this.store.error()) this.notify('MFA désactivé.');
  }
}
