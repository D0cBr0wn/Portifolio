import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../core/stores/auth.store';
import { TechBadgeComponent } from '../../shared/components/tech-badge.component';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Lieux', icon: 'place', path: '/backoffice/venues' },
  { label: 'Concerts', icon: 'music_note', path: '/backoffice/shows' },
  { label: 'Sécurité MFA', icon: 'shield', path: '/backoffice/mfa-setup' },
];

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    TechBadgeComponent,
  ],
  template: `
    <mat-sidenav-container class="admin-container">
      <mat-sidenav mode="side" opened class="admin-drawer">
        <div class="drawer-toolbar-spacer"></div>
        <mat-nav-list>
          @for (item of navItems; track item.path) {
            <a mat-list-item
               [routerLink]="item.path"
               routerLinkActive="active-nav"
               class="nav-item">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
          @if (auth.isAdmin()) {
            <a mat-list-item
               routerLink="/backoffice/users"
               routerLinkActive="active-nav"
               class="nav-item">
              <mat-icon matListItemIcon>people</mat-icon>
              <span matListItemTitle>Utilisateurs</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="admin-toolbar">
          <span class="toolbar-title">Portfolio — Backoffice</span>
          <button mat-button (click)="logout()">Déconnexion</button>
        </mat-toolbar>

        <main class="admin-main">
          <ng-content />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>

    <app-tech-badge />
  `,
  styles: [`
    .admin-container {
      height: 100vh;
    }

    .admin-drawer {
      width: 240px;
      padding-top: 64px;
    }

    .drawer-toolbar-spacer {
      height: 0;
    }

    .admin-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;

      .toolbar-title {
        flex: 1;
      }
    }

    .admin-main {
      padding: 1.5rem;
    }

    .nav-item {
      &.active-nav {
        background-color: rgba(98, 0, 238, 0.12);
        color: #6200EE;

        mat-icon {
          color: #6200EE;
        }
      }
    }
  `],
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly navItems = NAV_ITEMS;

  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
