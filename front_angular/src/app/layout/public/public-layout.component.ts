import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TechBadgeComponent } from '../../shared/components/tech-badge.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TechBadgeComponent],
  template: `
    <div class="public-shell">
      <header class="public-header">
        <a routerLink="/">
          <img src="logo.png" alt="Portfolio" class="header-logo" />
        </a>
        <nav class="header-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Accueil</a>
          <a routerLink="/shows" routerLinkActive="active">Concerts</a>
        </nav>
      </header>

      <main class="public-main">
        <ng-content />
      </main>

      <footer class="public-footer">
        <p>&copy; {{ year }} Portfolio</p>
      </footer>

      <app-tech-badge />
    </div>
  `,
  styles: [`
    .public-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #1a1a1a;
      color: #fff;
    }

    .public-header {
      height: 300px;
      background-image: url('/bg.jpg');
      background-size: cover;
      background-position: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .header-logo {
      max-width: 400px;
      max-height: 200px;
      object-fit: contain;
    }

    .header-nav {
      display: flex;
      gap: 2rem;

      a {
        color: #ffffff;
        text-decoration: none;
        font-size: 1.1rem;
        padding-bottom: 2px;
        border-bottom: 2px solid transparent;

        &.active {
          border-bottom-color: #000;
        }
      }
    }

    .public-main {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem 1rem;
      box-sizing: border-box;
    }

    .public-footer {
      padding: 1rem;
      text-align: center;
      color: #888;
      font-size: 0.9rem;

      p { margin: 0; }
    }
  `],
})
export class PublicLayoutComponent {
  readonly year = new Date().getFullYear();
}
