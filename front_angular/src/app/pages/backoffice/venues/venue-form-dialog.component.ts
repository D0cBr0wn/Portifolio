import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import type { VenueData, VenueWithCreator } from '@portfolio/shared';

interface DialogData {
  initial: VenueWithCreator | null;
}

@Component({
  selector: 'app-venue-form-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="form-container">
      <h2>{{ data.initial ? 'Modifier le lieu' : 'Nouveau lieu' }}</h2>

      <form (ngSubmit)="submit()">
        <div class="form-row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Nom du lieu *</mat-label>
            <input matInput name="name" [(ngModel)]="name" required />
            @if (nameError()) { <mat-error>{{ nameError() }}</mat-error> }
          </mat-form-field>
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Ville *</mat-label>
            <input matInput name="city" [(ngModel)]="city" required />
            @if (cityError()) { <mat-error>{{ cityError() }}</mat-error> }
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" style="flex: 2">
            <mat-label>Adresse</mat-label>
            <input matInput name="address1" [(ngModel)]="address1" />
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex: 1">
            <mat-label>Code postal</mat-label>
            <input matInput name="zipCode" [(ngModel)]="zipCode" />
          </mat-form-field>
        </div>

        <div class="form-actions">
          <button mat-raised-button color="primary" type="submit">Enregistrer</button>
          <button mat-button type="button" (click)="dialogRef.close()">Annuler</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container { padding: 1.5rem; min-width: 400px; }
    h2 { margin: 0 0 1.5rem; font-size: 1.2rem; font-weight: 500; }
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .flex-1 { flex: 1; min-width: 160px; }
    mat-form-field { width: 100%; }
    .form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
  `],
})
export class VenueFormDialogComponent implements OnInit {
  protected readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<VenueFormDialogComponent>);

  readonly nameError = signal('');
  readonly cityError = signal('');

  name = '';
  city = '';
  address1 = '';
  zipCode = '';

  ngOnInit(): void {
    const init = this.data.initial;
    if (init) {
      this.name = init.name;
      this.city = init.city;
      this.address1 = init.address1 ?? '';
      this.zipCode = init.zipCode ?? '';
    }
  }

  submit(): void {
    this.nameError.set(this.name ? '' : 'Champ requis');
    this.cityError.set(this.city ? '' : 'Champ requis');
    if (this.nameError() || this.cityError()) return;

    const payload: Omit<VenueData, 'id'> = {
      name: this.name,
      city: this.city,
      address1: this.address1 || undefined,
      zipCode: this.zipCode || undefined,
    };
    this.dialogRef.close(payload);
  }
}
