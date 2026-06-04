import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BackofficeService } from './backoffice.service';

const BASE = 'http://localhost:3000/api';

describe('BackofficeService', () => {
  let service: BackofficeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BackofficeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getShows() GET /backoffice/shows', (done) => {
    const shows = [{ id: 1, label: 'BO Show', date: '2025-01-01', venueId: 1, createdBy: null, createdAt: '2025-01-01' }];
    service.getShows().subscribe((res) => {
      expect(res).toEqual(shows);
      done();
    });
    http.expectOne(`${BASE}/backoffice/shows`).flush(shows);
  });

  it('getVenues() GET /backoffice/venues', (done) => {
    const venues = [{ id: 1, name: 'Salle', city: 'Lyon', createdBy: null, createdAt: '2025-01-01' }];
    service.getVenues().subscribe((res) => {
      expect(res).toEqual(venues);
      done();
    });
    http.expectOne(`${BASE}/backoffice/venues`).flush(venues);
  });
});
