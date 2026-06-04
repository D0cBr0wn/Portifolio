import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { ShowWithCreator, VenueWithCreator } from '@portfolio/shared';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BackofficeService {
  private readonly api = inject(ApiService);

  getShows(): Observable<ShowWithCreator[]> {
    return this.api.get<ShowWithCreator[]>('/backoffice/shows');
  }

  getVenues(): Observable<VenueWithCreator[]> {
    return this.api.get<VenueWithCreator[]>('/backoffice/venues');
  }
}
