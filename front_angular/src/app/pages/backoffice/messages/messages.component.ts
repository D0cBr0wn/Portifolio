import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
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
  `],
})
export class BackofficeMessagesComponent implements OnInit {
  private readonly contactService = inject(ContactService);
  private readonly dialog = inject(MatDialog);

  protected readonly messages = signal<ContactMessage[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly columns = ['createdAt', 'name', 'email', 'message'];
  protected readonly fmtDate = formatDate;
  protected readonly truncate = truncate;

  ngOnInit(): void {
    this.contactService.getMessages().subscribe({
      next: (msgs) => this.messages.set(msgs),
      error: () => this.error.set('Impossible de charger les messages.'),
      complete: () => this.loading.set(false),
    });
  }

  openDetail(msg: ContactMessage): void {
    this.dialog.open(MessageDetailDialogComponent, {
      maxWidth: '600px',
      width: '100%',
      data: { name: msg.name, email: msg.email, createdAt: msg.createdAt, message: msg.message },
    });
  }
}
