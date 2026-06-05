import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PublicLayoutComponent } from '../../layout/public/public-layout.component';
import { ShowStore } from '../../core/stores/show.store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, PublicLayoutComponent],
  template: `
    <app-public-layout>
      <div class="hero-text">
        <h1 class="hero-title" data-testid="home-heading">Portfolio</h1>
        <p class="hero-desc">
          Odyssey Of One, is a raw, minimalist folk music project, built around
          Nico's guitar and voice, formerly the bass player of the post-hardcore
          band TANEN. Listening to Bob Dylan and The Tallest Man On Earth
          introduced him to this introspective, authentic language. On stage, he
          offers a stripped-down, sincere experience: one voice, one guitar, and
          the desire to convey pure, unadorned emotion. The project also stands
          out for its willingness to share the creative process in real time,
          inviting listeners to follow the album's progress via social networks.
          Join the journey.
        </p>
      </div>

      @if (nextShows().length > 0) {
        <div class="next-shows">
          <h2 class="section-title">Prochains concerts</h2>
          <div class="shows-grid">
            @for (show of nextShows(); track show.id) {
              <mat-card class="show-card">
                <mat-card-header>
                  <mat-card-title>{{ show.label }}</mat-card-title>
                  <mat-card-subtitle>{{ show.getFormattedDate() }}</mat-card-subtitle>
                </mat-card-header>
                @if (show.venue) {
                  <mat-card-content>
                    <div class="venue-info">
                      <mat-icon>place</mat-icon>
                      <span>{{ show.venue.name }} — {{ show.venue.city }}</span>
                    </div>
                  </mat-card-content>
                }
              </mat-card>
            }
          </div>
          <a mat-button [routerLink]="'/shows'" class="see-all-btn" data-testid="view-all-shows">
            Voir tous les concerts
            <mat-icon iconPositionEnd>arrow_forward</mat-icon>
          </a>
        </div>
      }

      @if (store.error()) {
        <div class="error-msg">{{ store.error() }}</div>
      }
    </app-public-layout>
  `,
  styles: [`
    .hero-text {
      text-align: center;
      padding: 3rem 0 2rem;
    }

    .hero-title {
      font-weight: 300;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #c59a47;
      font-size: 3.5rem;
      margin: 0 0 0.5rem;
    }

    .hero-desc {
      font-size: 1.2rem;
      color: #aaa;
      margin: 0.5rem auto 0;
      letter-spacing: 0.05em;
      max-width: 700px;
      line-height: 1.7;
    }

    .next-shows {
      margin-top: 3rem;
    }

    .section-title {
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #ddd;
      font-size: 1.4rem;
      margin: 0 0 1.5rem;
    }

    .shows-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .show-card {
      height: 100%;
      background: #222 !important;
      border: 1px solid #333 !important;

      ::ng-deep .mat-mdc-card-title { color: #ddd; }
      ::ng-deep .mat-mdc-card-subtitle { color: #c59a47; }
    }

    .venue-info {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #aaa;
      font-size: 0.9rem;

      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }

    .see-all-btn {
      margin-top: 1rem;
      color: #c59a47;
    }

    .error-msg {
      margin-top: 2rem;
      color: #cf6679;
      padding: 0.75rem 1rem;
      border: 1px solid #cf6679;
      border-radius: 4px;
    }
  `],
})
export class HomeComponent implements OnInit {
  protected readonly store = inject(ShowStore);

  protected readonly nextShows = computed(() => {
    const now = new Date();
    return this.store.shows()
      .filter((s) => s.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3);
  });

  ngOnInit(): void {
    this.store.load();
  }
}
