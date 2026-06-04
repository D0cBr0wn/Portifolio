import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Venue } from '@portfolio/shared';
import type { VenueData } from '@portfolio/shared';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class VenueService {
  private readonly api = inject(ApiService);

  getAll(): Observable<Venue[]> {
    return this.api.get<VenueData[]>('/venues').pipe(map((data) => data.map((d) => new Venue(d))));
  }

  create(payload: Omit<VenueData, 'id'>): Observable<Venue> {
    return this.api.post<VenueData>('/venues', payload).pipe(map((d) => new Venue(d)));
  }

  update(id: number, payload: Partial<Omit<VenueData, 'id'>>): Observable<Venue> {
    return this.api.put<VenueData>(`/venues/${id}`, payload).pipe(map((d) => new Venue(d)));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/venues/${id}`);
  }
}
