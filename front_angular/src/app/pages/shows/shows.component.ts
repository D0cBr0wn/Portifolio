import { Component, inject, OnInit, computed } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PublicLayoutComponent } from '../../layout/public/public-layout.component';
import { ShowStore } from '../../core/stores/show.store';
import type { Show } from '@portfolio/shared';

function formatDate(show: Show): string {
  const d = show.date;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatRest(show: Show): string {
  const zip = show.venue?.zipCode ? ` (${show.venue.zipCode})` : '';
  const venue = show.venue ? `${show.venue.name} — ${show.venue.city}${zip}` : '—';
  return show.details ? `${venue}  ${show.details}` : venue;
}

@Component({
  selector: 'app-shows',
  standalone: true,
  imports: [MatProgressBarModule, PublicLayoutComponent],
  template: `
    <app-public-layout>
      <h1 class="page-title">Concerts</h1>

      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" color="primary" />
      }

      @if (store.error()) {
        <div class="error-msg">{{ store.error() }}</div>
      }

      @if (!store.loading()) {
        @if (upcoming().length > 0) {
          <ul class="show-list">
            @for (show of upcoming(); track show.id) {
              <li class="show-item">
                <span class="show-date">{{ fmtDate(show) }}</span>
                <span class="show-rest">  {{ fmtRest(show) }}</span>
                @if (show.label) {
                  <span class="show-label">{{ show.label }}</span>
                }
              </li>
            }
          </ul>
        }

        @if (past().length > 0) {
          <p class="past-label">Passés</p>
          <ul class="show-list past">
            @for (show of past(); track show.id) {
              <li class="show-item">
                <span class="show-date">{{ fmtDate(show) }}</span>
                <span class="show-rest">  {{ fmtRest(show) }}</span>
                @if (show.label) {
                  <span class="show-label">{{ show.label }}</span>
                }
              </li>
            }
          </ul>
        }

        @if (upcoming().length === 0 && past().length === 0) {
          <p class="empty-msg">Aucun concert pour le moment.</p>
        }
      }
    </app-public-layout>
  `,
  styles: [`
    .page-title {
      font-weight: 300;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #c59a47;
      font-size: 2rem;
      margin: 0 0 2rem;
    }

    .show-list {
      list-style: none;
      padding: 0;
      margin: 0 0 2rem;
    }

    .past { opacity: 0.5; }

    .show-item {
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      gap: 0.1rem;

      &:last-child { border-bottom: none; }
    }

    .show-date {
      color: #c59a47;
      font-variant-numeric: tabular-nums;
    }

    .show-rest { color: #e0e0e0; }

    .show-label {
      font-size: 0.85rem;
      color: #888;
      font-style: italic;
    }

    .past-label {
      font-size: 1rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #aaa;
      margin: 0 0 0.5rem;
    }

    .empty-msg {
      color: #666;
      text-align: center;
      margin-top: 4rem;
    }

    .error-msg {
      color: #cf6679;
      border: 1px solid #cf6679;
      border-radius: 4px;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
    }
  `],
})
export class ShowsComponent implements OnInit {
  protected readonly store = inject(ShowStore);

  protected readonly upcoming = computed(() => {
    const now = new Date();
    return this.store.shows()
      .filter((s) => s.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  protected readonly past = computed(() => {
    const now = new Date();
    return this.store.shows()
      .filter((s) => s.date < now)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  protected readonly fmtDate = formatDate;
  protected readonly fmtRest = formatRest;

  ngOnInit(): void {
    this.store.load();
  }
}
