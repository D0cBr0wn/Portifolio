import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import type { ShowData, Venue } from '@portfolio/shared';

interface DialogData {
  venues: Venue[];
  initial: ShowData | null;
}

function toLocalDatetimeString(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

@Component({
  selector: 'app-show-form-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <div class="form-container">
      <h2 data-testid="show-dialog-title">{{ data.initial ? 'Modifier le concert' : 'Nouveau concert' }}</h2>

      <form (ngSubmit)="submit()">
        <div class="form-row">
          <mat-form-field appearance="outline" style="flex: 2">
            <mat-label>Nom du concert</mat-label>
            <input matInput name="label" [(ngModel)]="label" data-testid="show-label-input" />
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex: 1.5">
            <mat-label>Date *</mat-label>
            <input matInput type="datetime-local" name="date" [(ngModel)]="date" required data-testid="show-date-input" />
            @if (dateError()) { <mat-error>{{ dateError() }}</mat-error> }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Lieu *</mat-label>
          <mat-select name="venueId" [(ngModel)]="venueId" required data-testid="show-venue-select">
            @for (v of data.venues; track v.id) {
              <mat-option [value]="v.id">{{ v.name }}</mat-option>
            }
          </mat-select>
          @if (venueError()) { <mat-error>{{ venueError() }}</mat-error> }
          @if (!data.venues.length) {
            <mat-hint>Aucun lieu disponible — créez-en un d'abord.</mat-hint>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Détails</mat-label>
          <textarea matInput name="details" [(ngModel)]="details" rows="3"></textarea>
        </mat-form-field>

        <div class="form-actions">
          <button mat-raised-button color="primary" type="submit" data-testid="save-btn">Enregistrer</button>
          <button mat-button type="button" (click)="dialogRef.close()">Annuler</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container { padding: 1.5rem; min-width: 400px; }
    h2 { margin: 0 0 1.5rem; font-size: 1.2rem; font-weight: 500; }
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .full-width { width: 100%; }
    mat-form-field { min-width: 140px; }
    .form-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
  `],
})
export class ShowFormDialogComponent implements OnInit {
  protected readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<ShowFormDialogComponent>);

  readonly dateError = signal('');
  readonly venueError = signal('');

  label = '';
  date = '';
  venueId: number | '' = '';
  details = '';

  ngOnInit(): void {
    const init = this.data.initial;
    if (init) {
      this.label = init.label ?? '';
      this.date = toLocalDatetimeString(new Date(init.date));
      this.venueId = init.venueId;
      this.details = init.details ?? '';
    }
  }

  submit(): void {
    this.dateError.set(this.date ? '' : 'Champ requis');
    this.venueError.set(this.venueId ? '' : 'Champ requis');
    if (this.dateError() || this.venueError()) return;

    const payload: Omit<ShowData, 'id' | 'venue'> = {
      label: this.label || undefined,
      details: this.details || undefined,
      date: new Date(this.date).toISOString(),
      venueId: this.venueId as number,
    };
    this.dialogRef.close(payload);
  }
}
