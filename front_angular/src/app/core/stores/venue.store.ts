import { Injectable, inject, signal } from '@angular/core';
import type { Venue, VenueData, VenueWithCreator } from '@portfolio/shared';
import { VenueService } from '../services/venue.service';
import { BackofficeService } from '../services/backoffice.service';

@Injectable({ providedIn: 'root' })
export class VenueStore {
  private readonly venueService = inject(VenueService);
  private readonly backofficeService = inject(BackofficeService);

  readonly venues = signal<Venue[]>([]);
  readonly backofficeVenues = signal<VenueWithCreator[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.venueService.getAll().subscribe({
      next: (venues) => this.venues.set(venues),
      error: () => this.error.set('Impossible de charger les lieux.'),
      complete: () => this.loading.set(false),
    });
  }

  loadBackoffice(): void {
    this.loading.set(true);
    this.error.set(null);
    this.backofficeService.getVenues().subscribe({
      next: (venues) => this.backofficeVenues.set(venues),
      error: () => this.error.set('Impossible de charger les lieux (backoffice).'),
      complete: () => this.loading.set(false),
    });
  }

  create(data: Omit<VenueData, 'id'>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    return new Promise((resolve, reject) => {
      this.venueService.create(data).subscribe({
        next: (venue) => this.venues.update((list) => [...list, venue]),
        error: (e: Error) => {
          this.error.set(e.message || 'Impossible de créer le lieu.');
          this.loading.set(false);
          reject(e);
        },
        complete: () => { this.loading.set(false); resolve(); },
      });
    });
  }

  update(id: number, data: Partial<Omit<VenueData, 'id'>>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    return new Promise((resolve, reject) => {
      this.venueService.update(id, data).subscribe({
        next: (venue) => this.venues.update((list) => list.map((v) => v.id === id ? venue : v)),
        error: (e: Error) => {
          this.error.set(e.message || 'Impossible de modifier le lieu.');
          this.loading.set(false);
          reject(e);
        },
        complete: () => { this.loading.set(false); resolve(); },
      });
    });
  }

  remove(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    return new Promise((resolve, reject) => {
      this.venueService.remove(id).subscribe({
        next: () => this.venues.update((list) => list.filter((v) => v.id !== id)),
        error: (e: Error) => {
          this.error.set(e.message || 'Impossible de supprimer le lieu.');
          this.loading.set(false);
          reject(e);
        },
        complete: () => { this.loading.set(false); resolve(); },
      });
    });
  }
}
