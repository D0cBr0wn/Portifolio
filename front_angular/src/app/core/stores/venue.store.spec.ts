import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VenueStore } from './venue.store';
import { VenueService } from '../services/venue.service';
import { BackofficeService } from '../services/backoffice.service';
import { Venue } from '@portfolio/shared';

const makeVenue = (id: number) => new Venue({ id, name: `Venue ${id}`, city: 'Paris' });
const boVenue = { id: 1, name: 'BO Venue', city: 'Lyon', createdBy: null, createdAt: '2025-01-01' };

describe('VenueStore', () => {
  let store: VenueStore;
  let venueService: jest.Mocked<VenueService>;
  let boService: jest.Mocked<BackofficeService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VenueStore,
        { provide: VenueService, useValue: { getAll: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() } },
        { provide: BackofficeService, useValue: { getShows: jest.fn(), getVenues: jest.fn() } },
      ],
    });
    store = TestBed.inject(VenueStore);
    venueService = TestBed.inject(VenueService) as jest.Mocked<VenueService>;
    boService = TestBed.inject(BackofficeService) as jest.Mocked<BackofficeService>;
  });

  it('état initial : venues vide, loading false, error null', () => {
    expect(store.venues()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('load() charge les venues', () => {
    venueService.getAll.mockReturnValue(of([makeVenue(1)]));
    store.load();
    expect(store.venues()).toHaveLength(1);
    expect(store.loading()).toBe(false);
  });

  it('load() définit error en cas d\'échec', () => {
    venueService.getAll.mockReturnValue(throwError(() => new Error('fail')));
    store.load();
    expect(store.error()).toBeTruthy();
  });

  it('loadBackoffice() charge les venues backoffice', () => {
    boService.getVenues.mockReturnValue(of([boVenue]));
    store.loadBackoffice();
    expect(store.backofficeVenues()).toHaveLength(1);
  });

  it('create() ajoute la venue à la liste', async () => {
    const created = makeVenue(5);
    venueService.create.mockReturnValue(of(created));
    await store.create({ name: 'Venue 5', city: 'Paris' });
    expect(store.venues()).toContainEqual(created);
  });

  it('remove() retire la venue de la liste', async () => {
    venueService.getAll.mockReturnValue(of([makeVenue(1), makeVenue(2)]));
    store.load();
    venueService.remove.mockReturnValue(of(undefined as unknown as void));
    await store.remove(1);
    expect(store.venues().find((v) => v.id === 1)).toBeUndefined();
  });
});
