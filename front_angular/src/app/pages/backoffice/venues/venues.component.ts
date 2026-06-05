import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminLayoutComponent } from '../../../layout/admin/admin-layout.component';
import { VenueStore } from '../../../core/stores/venue.store';
import { VenueFormDialogComponent } from './venue-form-dialog.component';
import type { VenueData, VenueWithCreator } from '@portfolio/shared';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatAddress(row: VenueWithCreator): string {
  return [row.address1, row.zipCode, row.city].filter(Boolean).join(', ') || '—';
}

@Component({
  selector: 'app-venues',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    AdminLayoutComponent,
  ],
  template: `
    <app-admin-layout>
      <div class="page-header">
        <h1 class="page-title">Lieux de concerts</h1>
        <button mat-raised-button color="primary" (click)="openCreate()">
          <mat-icon>add</mat-icon> Ajouter un lieu
        </button>
      </div>

      @if (store.error()) {
        <div class="error-msg">{{ store.error() }}</div>
      }

      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" color="primary" />
      }

      <div class="table-wrapper">
        <table mat-table [dataSource]="store.backofficeVenues()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>

          <ng-container matColumnDef="city">
            <th mat-header-cell *matHeaderCellDef>Ville</th>
            <td mat-cell *matCellDef="let row">{{ row.city }}</td>
          </ng-container>

          <ng-container matColumnDef="address">
            <th mat-header-cell *matHeaderCellDef>Adresse</th>
            <td mat-cell *matCellDef="let row">{{ fmtAddress(row) }}</td>
          </ng-container>

          <ng-container matColumnDef="createdBy">
            <th mat-header-cell *matHeaderCellDef>Créé par</th>
            <td mat-cell *matCellDef="let row">{{ row.createdBy?.email || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Créé le</th>
            <td mat-cell *matCellDef="let row">{{ fmtDate(row.createdAt) }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button (click)="openEdit(row)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="confirmDelete(row)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
      </div>

      @if (deleteTarget()) {
        <div class="confirm-overlay" (click)="deleteTarget.set(null)">
          <div class="confirm-dialog" (click)="$event.stopPropagation()">
            <h3>Confirmer la suppression</h3>
            <p>Supprimer le lieu <strong>{{ deleteTarget()!.name }}</strong> ?<br />Cette action est irréversible.</p>
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
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 400;
      margin: 0;
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
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      min-width: 320px;
      max-width: 480px;

      h3 { margin: 0 0 1rem; font-size: 1.1rem; }
      p { color: rgba(0,0,0,0.6); margin: 0 0 1.5rem; }
    }

    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `],
})
export class VenuesComponent implements OnInit {
  protected readonly store = inject(VenueStore);
  private readonly dialog = inject(MatDialog);

  protected readonly columns = ['name', 'city', 'address', 'createdBy', 'createdAt', 'actions'];
  protected readonly deleteTarget = signal<VenueWithCreator | null>(null);

  protected readonly fmtDate = formatDate;
  protected readonly fmtAddress = formatAddress;

  ngOnInit(): void {
    this.store.loadBackoffice();
    this.store.load();
  }

  openCreate(): void {
    const ref = this.dialog.open(VenueFormDialogComponent, {
      maxWidth: '600px',
      width: '100%',
      data: { initial: null, loading: this.store.loading },
    });
    ref.afterClosed().subscribe(async (data: Omit<VenueData, 'id'> | undefined) => {
      if (!data) return;
      await this.store.create(data);
      if (!this.store.error()) this.store.loadBackoffice();
    });
  }

  openEdit(row: VenueWithCreator): void {
    const ref = this.dialog.open(VenueFormDialogComponent, {
      maxWidth: '600px',
      width: '100%',
      data: { initial: row, loading: this.store.loading },
    });
    ref.afterClosed().subscribe(async (data: Omit<VenueData, 'id'> | undefined) => {
      if (!data) return;
      await this.store.update(row.id, data);
      if (!this.store.error()) this.store.loadBackoffice();
    });
  }

  confirmDelete(row: VenueWithCreator): void {
    this.deleteTarget.set(row);
  }

  async doDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    await this.store.remove(target.id);
    if (!this.store.error()) {
      this.deleteTarget.set(null);
      this.store.loadBackoffice();
    }
  }
}
