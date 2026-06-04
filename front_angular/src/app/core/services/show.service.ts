import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Show } from '@portfolio/shared';
import type { ShowData } from '@portfolio/shared';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ShowService {
  private readonly api = inject(ApiService);

  getAll(): Observable<Show[]> {
    return this.api.get<ShowData[]>('/shows').pipe(map((data) => data.map((d) => new Show(d))));
  }

  create(payload: Omit<ShowData, 'id' | 'venue'>): Observable<Show> {
    return this.api.post<ShowData>('/shows', payload).pipe(map((d) => new Show(d)));
  }

  update(id: number, payload: Partial<Omit<ShowData, 'id' | 'venue'>>): Observable<Show> {
    return this.api.put<ShowData>(`/shows/${id}`, payload).pipe(map((d) => new Show(d)));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/shows/${id}`);
  }
}
