import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ShowService } from './show.service';
import { Show } from '@portfolio/shared';

const BASE = 'http://localhost:3000/api';

const showData = {
  id: 1, label: 'Concert', date: '2025-07-14T20:00:00.000Z', venueId: 1,
  venue: { id: 1, name: 'Le Zénith', city: 'Paris' },
};

describe('ShowService', () => {
  let service: ShowService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ShowService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll() retourne un tableau de Show', (done) => {
    service.getAll().subscribe((shows) => {
      expect(shows).toHaveLength(1);
      expect(shows[0]).toBeInstanceOf(Show);
      expect(shows[0].label).toBe('Concert');
      done();
    });
    http.expectOne(`${BASE}/shows`).flush([showData]);
  });

  it('create() POST /shows et retourne un Show', (done) => {
    const payload = { label: 'Nouveau', date: '2025-09-01T20:00:00.000Z', venueId: 1 };
    service.create(payload).subscribe((show) => {
      expect(show).toBeInstanceOf(Show);
      expect(show.id).toBe(2);
      done();
    });
    const req = http.expectOne(`${BASE}/shows`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...showData, id: 2 });
  });

  it('update() PUT /shows/:id et retourne le Show mis à jour', (done) => {
    service.update(1, { label: 'Modifié' }).subscribe((show) => {
      expect(show.label).toBe('Modifié');
      done();
    });
    const req = http.expectOne(`${BASE}/shows/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...showData, label: 'Modifié' });
  });

  it('remove() DELETE /shows/:id', (done) => {
    service.remove(1).subscribe(() => done());
    const req = http.expectOne(`${BASE}/shows/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
