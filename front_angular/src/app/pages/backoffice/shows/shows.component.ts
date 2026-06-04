import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminLayoutComponent } from '../../../layout/admin/admin-layout.component';
import { ShowStore } from '../../../core/stores/show.store';
import { VenueStore } from '../../../core/stores/venue.store';
import { ShowFormDialogComponent } from './show-form-dialog.component';
import type { ShowData, ShowWithCreator } from '@portfolio/shared';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

@Component({
  selector: 'app-backoffice-shows',
  standalone: true,
  imports: [
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
        <h1 class="page-title">Concerts</h1>
        <button mat-raised-button color="primary" (click)="openCreate()">
          <mat-icon>add</mat-icon> Ajouter un concert
        </button>
      </div>

      @if (showStore.error()) {
        <div class="error-msg">{{ showStore.error() }}</div>
      }

      @if (showStore.loading()) {
        <mat-progress-bar mode="indeterminate" color="primary" />
      }

      <div class="table-wrapper">
        <table mat-table [dataSource]="showStore.backofficeShows()" class="full-width">
          <ng-container matColumnDef="label">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let row">{{ row.label || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let row">{{ fmtDate(row.date) }}</td>
          </ng-container>

          <ng-container matColumnDef="venue">
            <th mat-header-cell *matHeaderCellDef>Lieu</th>
            <td mat-cell *matCellDef="let row">{{ row.venue?.name || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="city">
            <th mat-header-cell *matHeaderCellDef>Ville</th>
            <td mat-cell *matCellDef="let row">{{ row.venue?.city || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="createdBy">
            <th mat-header-cell *matHeaderCellDef>Créé par</th>
            <td mat-cell *matCellDef="let row">{{ row.createdBy?.email || '—' }}</td>
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
            <p>Supprimer le concert <strong>{{ deleteTarget()!.label || deleteTarget()!.date }}</strong> ?</p>
            <div class="confirm-actions">
              <button mat-button (click)="deleteTarget.set(null)">Annuler</button>
              <button mat-raised-button color="warn" (click)="doDelete()" [disabled]="showStore.loading()">Supprimer</button>
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

    .page-title { font-size: 1.5rem; font-weight: 400; margin: 0; }

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
      background: #2a2a2a;
      border-radius: 8px;
      padding: 1.5rem;
      min-width: 320px;

      h3 { margin: 0 0 1rem; }
      p { color: #aaa; margin: 0 0 1.5rem; }
    }

    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `],
})
export class BackofficeShowsComponent implements OnInit {
  protected readonly showStore = inject(ShowStore);
  private readonly venueStore = inject(VenueStore);
  private readonly dialog = inject(MatDialog);

  protected readonly columns = ['label', 'date', 'venue', 'city', 'createdBy', 'actions'];
  protected readonly deleteTarget = signal<ShowWithCreator | null>(null);
  protected readonly fmtDate = formatDate;

  ngOnInit(): void {
    this.showStore.loadBackoffice();
    this.venueStore.load();
  }

  openCreate(): void {
    const ref = this.dialog.open(ShowFormDialogComponent, {
      maxWidth: '640px',
      width: '100%',
      data: { venues: this.venueStore.venues(), initial: null },
    });
    ref.afterClosed().subscribe(async (data: Omit<ShowData, 'id' | 'venue'> | undefined) => {
      if (!data) return;
      await this.showStore.create(data);
      if (!this.showStore.error()) this.showStore.loadBackoffice();
    });
  }

  openEdit(row: ShowWithCreator): void {
    const ref = this.dialog.open(ShowFormDialogComponent, {
      maxWidth: '640px',
      width: '100%',
      data: { venues: this.venueStore.venues(), initial: row },
    });
    ref.afterClosed().subscribe(async (data: Omit<ShowData, 'id' | 'venue'> | undefined) => {
      if (!data) return;
      await this.showStore.update(row.id, data);
      if (!this.showStore.error()) this.showStore.loadBackoffice();
    });
  }

  confirmDelete(row: ShowWithCreator): void {
    this.deleteTarget.set(row);
  }

  async doDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    await this.showStore.remove(target.id);
    if (!this.showStore.error()) {
      this.deleteTarget.set(null);
      this.showStore.loadBackoffice();
    }
  }
}
