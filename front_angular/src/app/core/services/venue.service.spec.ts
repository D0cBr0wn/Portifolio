import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VenueService } from './venue.service';
import { Venue } from '@portfolio/shared';

const BASE = 'http://localhost:3000/api';
const venueData = { id: 1, name: 'Le Zénith', city: 'Paris' };

describe('VenueService', () => {
  let service: VenueService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(VenueService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll() retourne un tableau de Venue', (done) => {
    service.getAll().subscribe((venues) => {
      expect(venues).toHaveLength(1);
      expect(venues[0]).toBeInstanceOf(Venue);
      expect(venues[0].name).toBe('Le Zénith');
      done();
    });
    http.expectOne(`${BASE}/venues`).flush([venueData]);
  });

  it('create() POST /venues et retourne une Venue', (done) => {
    service.create({ name: 'Olympia', city: 'Paris' }).subscribe((venue) => {
      expect(venue).toBeInstanceOf(Venue);
      expect(venue.id).toBe(2);
      done();
    });
    const req = http.expectOne(`${BASE}/venues`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...venueData, id: 2 });
  });

  it('update() PUT /venues/:id et retourne la Venue mise à jour', (done) => {
    service.update(1, { city: 'Lyon' }).subscribe((venue) => {
      expect(venue.city).toBe('Lyon');
      done();
    });
    const req = http.expectOne(`${BASE}/venues/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...venueData, city: 'Lyon' });
  });

  it('remove() DELETE /venues/:id', (done) => {
    service.remove(1).subscribe(() => done());
    const req = http.expectOne(`${BASE}/venues/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
