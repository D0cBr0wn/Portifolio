import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminLayoutComponent } from '../../../layout/admin/admin-layout.component';
import { UserStore } from '../../../core/stores/user.store';
import type { UserData } from '@portfolio/shared';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    AdminLayoutComponent,
  ],
  template: `
    <app-admin-layout>
      <div class="page-header">
        <h1 class="page-title">Utilisateurs</h1>
      </div>

      <div class="filters-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Rechercher par email</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="searchQuery" placeholder="exemple@email.com" />
          @if (searchQuery()) {
            <button matSuffix mat-icon-button (click)="searchQuery.set('')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="role-filter">
          <mat-label>Rôle</mat-label>
          <mat-select [(ngModel)]="roleFilter">
            <mat-option value="">Tous</mat-option>
            <mat-option value="USER">USER</mat-option>
            <mat-option value="ADMIN">ADMIN</mat-option>
          </mat-select>
        </mat-form-field>

        @if (searchQuery() || roleFilter()) {
          <button mat-stroked-button (click)="clearFilters()">
            <mat-icon>filter_list_off</mat-icon> Réinitialiser
          </button>
        }

        <span class="result-count">{{ filteredUsers().length }} utilisateur(s)</span>
      </div>

      @if (store.error()) {
        <div class="error-msg">{{ store.error() }}</div>
      }

      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" color="primary" />
      }

      <div class="table-wrapper">
        <table mat-table [dataSource]="filteredUsers()" class="full-width">
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let row">{{ row.email }}</td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Rôle</th>
            <td mat-cell *matCellDef="let row">
              <span class="role-chip" [class.role-admin]="row.role === 'ADMIN'">
                {{ row.role }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="mfa">
            <th mat-header-cell *matHeaderCellDef>MFA</th>
            <td mat-cell *matCellDef="let row">
              <mat-icon
                [class.mfa-enabled]="row.mfaEnabled"
                [class.mfa-disabled]="!row.mfaEnabled"
                [matTooltip]="row.mfaEnabled ? 'MFA activé' : 'MFA désactivé'"
              >
                {{ row.mfaEnabled ? 'shield' : 'shield_off' }}
              </mat-icon>
            </td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Inscrit le</th>
            <td mat-cell *matCellDef="let row">{{ fmtDate(row.createdAt) }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button
                      color="warn"
                      [disabled]="row.role === 'ADMIN'"
                      [matTooltip]="row.role === 'ADMIN' ? 'Impossible de supprimer un administrateur' : 'Supprimer'"
                      (click)="$event.stopPropagation(); confirmDelete(row)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"
              class="clickable-row"
              (click)="goToDetail(row)"></tr>
        </table>

        @if (!store.loading() && filteredUsers().length === 0) {
          <div class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <p>Aucun utilisateur trouvé.</p>
          </div>
        }
      </div>

      @if (deleteTarget()) {
        <div class="confirm-overlay" (click)="deleteTarget.set(null)">
          <div class="confirm-dialog" (click)="$event.stopPropagation()">
            <h3>Confirmer la suppression</h3>
            <p>Supprimer l'utilisateur <strong>{{ deleteTarget()!.email }}</strong> ?<br />Cette action est irréversible.</p>
            <div class="confirm-actions">
              <button mat-button (click)="deleteTarget.set(null)">Annuler</button>
              <button mat-raised-button color="warn" (click)="doDelete()" [disabled]="store.loading()">Supprimer</button>
            </div>
          </div>
        </div>
      }
    </app-admin-layout>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .page-title { font-size: 1.5rem; font-weight: 400; margin: 0; }

    .filters-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .search-field { flex: 1; min-width: 220px; max-width: 360px; }
    .role-filter { width: 140px; }

    .result-count {
      margin-left: auto;
      font-size: 0.875rem;
      color: #aaa;
    }

    .error-msg {
      color: #cf6679;
      border: 1px solid #cf6679;
      border-radius: 4px;
      padding: 0.75rem;
      margin-bottom: 1rem;
    }

    .table-wrapper { overflow-x: auto; }
    .full-width { width: 100%; }

    .clickable-row {
      cursor: pointer;
      &:hover { background: rgba(255,255,255,0.04); }
    }

    .role-chip {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      background: rgba(255,255,255,0.08);
      color: #ccc;

      &.role-admin {
        background: rgba(197, 154, 71, 0.2);
        color: #c59a47;
      }
    }

    .mfa-enabled { color: #4caf50; font-size: 20px; }
    .mfa-disabled { color: #555; font-size: 20px; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: #666;

      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 0.5rem; }
      p { margin: 0; }
    }

    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .confirm-dialog {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 1.5rem;
      min-width: 320px;
      max-width: 480px;

      h3 { margin: 0 0 1rem; font-size: 1.1rem; }
      p { color: #aaa; margin: 0 0 1.5rem; }
    }

    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `],
})
export class UsersComponent implements OnInit {
  protected readonly store = inject(UserStore);
  private readonly router = inject(Router);

  protected readonly columns = ['email', 'role', 'mfa', 'createdAt', 'actions'];
  protected readonly deleteTarget = signal<UserData | null>(null);
  protected readonly fmtDate = formatDate;

  readonly searchQuery = signal('');
  readonly roleFilter = signal('');

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const role = this.roleFilter();
    return this.store.users().filter((u) => {
      const matchEmail = !q || u.email.toLowerCase().includes(q);
      const matchRole = !role || u.role === role;
      return matchEmail && matchRole;
    });
  });

  ngOnInit(): void {
    this.store.load();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('');
  }

  goToDetail(user: UserData): void {
    this.router.navigate(['/backoffice/users', user.id]);
  }

  confirmDelete(user: UserData): void {
    this.deleteTarget.set(user);
  }

  async doDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    await this.store.remove(target.id);
    if (!this.store.error()) {
      this.deleteTarget.set(null);
    }
  }
}
