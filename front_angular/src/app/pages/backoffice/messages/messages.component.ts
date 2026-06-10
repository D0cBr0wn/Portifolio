import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AdminLayoutComponent } from '../../../layout/admin/admin-layout.component';
import { ContactService } from '../../../core/services/contact.service';
import type { ContactMessage } from '../../../core/services/contact.service';
import { MessageDetailDialogComponent } from './message-detail-dialog.component';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function truncate(text: string, max = 60): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

@Component({
  selector: 'app-backoffice-messages',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    AdminLayoutComponent,
  ],
  template: `
    <app-admin-layout>
      <div class="page-header">
        <h1 class="page-title">Messages de contact</h1>
      </div>

      @if (error()) {
        <div class="error-msg" data-testid="messages-error">{{ error() }}</div>
      }

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" color="primary" />
      }

      <div class="table-wrapper">
        <table mat-table [dataSource]="messages()" class="full-width" data-testid="messages-table">
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let row">{{ fmtDate(row.createdAt) }}</td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let row">{{ row.email }}</td>
          </ng-container>

          <ng-container matColumnDef="message">
            <th mat-header-cell *matHeaderCellDef>Message</th>
            <td mat-cell *matCellDef="let row">{{ truncate(row.message) }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button color="warn"
                      (click)="confirmDelete(row); $event.stopPropagation()"
                      data-testid="delete-btn">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"
              class="clickable-row"
              (click)="openDetail(row)"
              data-testid="message-row"></tr>
        </table>

        @if (!loading() && messages().length === 0 && !error()) {
          <div class="empty-state">
            <p>Aucun message pour le moment.</p>
          </div>
        }
      </div>

      @if (deleteTarget()) {
        <div class="confirm-overlay" (click)="deleteTarget.set(null)" data-testid="confirm-overlay">
          <div class="confirm-dialog" (click)="$event.stopPropagation()">
            <h3>Confirmer la suppression</h3>
            <p>Supprimer le message de <strong>{{ deleteTarget()!.name }}</strong> ?</p>
            @if (deleteError()) {
              <p class="delete-error-msg" data-testid="delete-error">{{ deleteError() }}</p>
            }
            <div class="confirm-actions">
              <button mat-button (click)="deleteTarget.set(null)" data-testid="cancel-delete-btn">Annuler</button>
              <button mat-raised-button color="warn" (click)="doDelete()" [disabled]="deleting()" data-testid="confirm-delete-btn">Supprimer</button>
            </div>
          </div>
        </div>
      }
    </app-admin-layout>
  `,
  styles: [`
    .page-header { margin-bottom: 1.25rem; }
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

    .clickable-row {
      cursor: pointer;
      &:hover { background: rgba(0,0,0,0.04); }
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: #666;
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
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      min-width: 320px;

      h3 { margin: 0 0 1rem; }
      p { color: rgba(0,0,0,0.6); margin: 0 0 1.5rem; }
    }

    .delete-error-msg {
      color: #cf6679;
      margin: 0 0 1rem !important;
    }

    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `],
})
export class BackofficeMessagesComponent implements OnInit {
  private readonly contactService = inject(ContactService);
  private readonly dialog = inject(MatDialog);

  protected readonly messages = signal<ContactMessage[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly deleteTarget = signal<ContactMessage | null>(null);
  protected readonly deleteError = signal('');
  protected readonly deleting = signal(false);

  protected readonly columns = ['createdAt', 'name', 'email', 'message', 'actions'];
  protected readonly fmtDate = formatDate;
  protected readonly truncate = truncate;

  ngOnInit(): void {
    this.contactService.getMessages().subscribe({
      next: (msgs) => this.messages.set(msgs),
      error: () => {
        this.error.set('Impossible de charger les messages.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  openDetail(msg: ContactMessage): void {
    const ref = this.dialog.open(MessageDetailDialogComponent, {
      maxWidth: '600px',
      width: '100%',
      data: { name: msg.name, email: msg.email, createdAt: msg.createdAt, message: msg.message },
    });
    ref.afterClosed().subscribe((result: string | undefined) => {
      if (result === 'delete') {
        this.confirmDelete(msg);
      }
    });
  }

  confirmDelete(msg: ContactMessage): void {
    this.deleteError.set('');
    this.deleteTarget.set(msg);
  }

  doDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.deleteError.set('');
    this.contactService.deleteMessage(target.id).subscribe({
      next: () => {
        this.messages.update(msgs => msgs.filter(m => m.id !== target.id));
        this.deleteTarget.set(null);
        this.deleting.set(false);
      },
      error: () => {
        this.deleteError.set('Impossible de supprimer le message.');
        this.deleting.set(false);
      },
    });
  }
}
