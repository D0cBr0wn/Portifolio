import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { UserData } from '@portfolio/shared';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  getAll(): Observable<UserData[]> {
    return this.api.get<UserData[]>('/users');
  }

  getById(id: number): Observable<UserData> {
    return this.api.get<UserData>(`/users/${id}`);
  }

  updateRole(id: number, role: 'USER' | 'ADMIN'): Observable<UserData> {
    return this.api.patch<UserData>(`/users/${id}/role`, { role });
  }

  updatePassword(id: number, password: string): Observable<UserData> {
    return this.api.put<UserData>(`/users/${id}`, { password });
  }

  requireMfa(id: number): Observable<void> {
    return this.api.post<void>(`/users/${id}/mfa/require`, {});
  }

  disableMfa(id: number): Observable<void> {
    return this.api.delete<void>(`/users/${id}/mfa`);
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/users/${id}`);
  }
}
