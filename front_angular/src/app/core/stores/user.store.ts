import { Injectable, inject, signal } from '@angular/core';
import type { UserData } from '@portfolio/shared';
import { UserService } from '../services/user.service';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly userService = inject(UserService);

  readonly users = signal<UserData[]>([]);
  readonly currentUser = signal<UserData | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.userService.getAll().subscribe({
      next: (users) => this.users.set(users),
      error: () => this.error.set('Impossible de charger les utilisateurs.'),
      complete: () => this.loading.set(false),
    });
  }

  loadOne(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.userService.getById(id).subscribe({
      next: (user) => this.currentUser.set(user),
      error: () => this.error.set('Impossible de charger l\'utilisateur.'),
      complete: () => this.loading.set(false),
    });
  }

  updateRole(id: number, role: 'USER' | 'ADMIN'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.updateRole(id, role).subscribe({
        next: (updated) => {
          this.users.update((list) => list.map((u) => u.id === id ? updated : u));
          if (this.currentUser()?.id === id) this.currentUser.set(updated);
        },
        error: (e: Error) => { this.error.set(e.message); reject(e); },
        complete: () => resolve(),
      });
    });
  }

  updatePassword(id: number, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.updatePassword(id, password).subscribe({
        error: (e: Error) => { this.error.set(e.message); reject(e); },
        complete: () => resolve(),
      });
    });
  }

  requireMfa(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.requireMfa(id).subscribe({
        next: () => {
          if (this.currentUser()?.id === id) {
            this.currentUser.update((u) => u ? { ...u, mfaRequired: true } : u);
          }
        },
        error: (e: Error) => { this.error.set(e.message); reject(e); },
        complete: () => resolve(),
      });
    });
  }

  disableMfa(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.disableMfa(id).subscribe({
        next: () => {
          if (this.currentUser()?.id === id) {
            this.currentUser.update((u) => u ? { ...u, mfaEnabled: false, mfaRequired: false } : u);
          }
        },
        error: (e: Error) => { this.error.set(e.message); reject(e); },
        complete: () => resolve(),
      });
    });
  }

  remove(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.remove(id).subscribe({
        next: () => this.users.update((list) => list.filter((u) => u.id !== id)),
        error: (e: Error) => { this.error.set(e.message); reject(e); },
        complete: () => resolve(),
      });
    });
  }
}
