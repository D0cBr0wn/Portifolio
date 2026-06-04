import { Injectable, inject, signal } from '@angular/core';
import type { Show, ShowData, ShowWithCreator } from '@portfolio/shared';
import { ShowService } from '../services/show.service';
import { BackofficeService } from '../services/backoffice.service';

@Injectable({ providedIn: 'root' })
export class ShowStore {
  private readonly showService = inject(ShowService);
  private readonly backofficeService = inject(BackofficeService);

  readonly shows = signal<Show[]>([]);
  readonly backofficeShows = signal<ShowWithCreator[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.showService.getAll().subscribe({
      next: (shows) => this.shows.set(shows),
      error: () => this.error.set('Impossible de charger les concerts.'),
      complete: () => this.loading.set(false),
    });
  }

  loadBackoffice(): void {
    this.loading.set(true);
    this.error.set(null);
    this.backofficeService.getShows().subscribe({
      next: (shows) => this.backofficeShows.set(shows),
      error: () => this.error.set('Impossible de charger les concerts (backoffice).'),
      complete: () => this.loading.set(false),
    });
  }

  create(data: Omit<ShowData, 'id' | 'venue'>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    return new Promise((resolve, reject) => {
      this.showService.create(data).subscribe({
        next: (show) => this.shows.update((list) => [...list, show]),
        error: (e: Error) => {
          this.error.set(e.message || 'Impossible de créer le concert.');
          this.loading.set(false);
          reject(e);
        },
        complete: () => { this.loading.set(false); resolve(); },
      });
    });
  }

  update(id: number, data: Partial<Omit<ShowData, 'id' | 'venue'>>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    return new Promise((resolve, reject) => {
      this.showService.update(id, data).subscribe({
        next: (show) => this.shows.update((list) => list.map((s) => s.id === id ? show : s)),
        error: (e: Error) => {
          this.error.set(e.message || 'Impossible de modifier le concert.');
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
      this.showService.remove(id).subscribe({
        next: () => this.shows.update((list) => list.filter((s) => s.id !== id)),
        error: (e: Error) => {
          this.error.set(e.message || 'Impossible de supprimer le concert.');
          this.loading.set(false);
          reject(e);
        },
        complete: () => { this.loading.set(false); resolve(); },
      });
    });
  }
}
