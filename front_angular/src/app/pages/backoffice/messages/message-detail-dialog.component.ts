import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface MessageDialogData {
  name: string;
  email: string;
  createdAt: string;
  message: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

@Component({
  selector: 'app-message-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title data-testid="dialog-title">Message de {{ data.name }}</h2>
      <mat-dialog-content>
        <p class="meta">{{ data.email }} — {{ fmtDate(data.createdAt) }}</p>
        <p class="body" data-testid="dialog-message">{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close data-testid="close-dialog-btn">Fermer</button>
        <button mat-button color="warn" [mat-dialog-close]="'delete'" data-testid="modal-delete-btn">Supprimer</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container { min-width: 400px; max-width: 560px; }
    h2 { margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 500; }
    .meta { color: rgba(0,0,0,0.55); font-size: 0.85rem; margin: 0 0 1rem; }
    .body { white-space: pre-wrap; line-height: 1.6; margin: 0; }
  `],
})
export class MessageDetailDialogComponent {
  protected readonly data = inject<MessageDialogData>(MAT_DIALOG_DATA);
  protected readonly fmtDate = formatDate;
}
