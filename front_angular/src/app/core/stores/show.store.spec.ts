import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ShowStore } from './show.store';
import { ShowService } from '../services/show.service';
import { BackofficeService } from '../services/backoffice.service';
import { Show } from '@portfolio/shared';

const makeShow = (id: number) => new Show({ id, label: `Show ${id}`, date: '2025-01-01T00:00:00.000Z', venueId: 1 });
const boShow = { id: 1, label: 'BO', date: '2025-01-01', venueId: 1, createdBy: null, createdAt: '2025-01-01' };

describe('ShowStore', () => {
  let store: ShowStore;
  let showService: jest.Mocked<ShowService>;
  let boService: jest.Mocked<BackofficeService>;

  beforeEach(() => {
    const mockShowService = { getAll: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() };
    const mockBoService = { getShows: jest.fn(), getVenues: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        ShowStore,
        { provide: ShowService, useValue: mockShowService },
        { provide: BackofficeService, useValue: mockBoService },
      ],
    });
    store = TestBed.inject(ShowStore);
    showService = TestBed.inject(ShowService) as jest.Mocked<ShowService>;
    boService = TestBed.inject(BackofficeService) as jest.Mocked<BackofficeService>;
  });

  it('état initial : shows vide, loading false, error null', () => {
    expect(store.shows()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('load() charge les shows', () => {
    showService.getAll.mockReturnValue(of([makeShow(1)]));
    store.load();
    expect(store.shows()).toHaveLength(1);
    expect(store.loading()).toBe(false);
  });

  it('load() définit error en cas d\'échec', () => {
    showService.getAll.mockReturnValue(throwError(() => new Error('fail')));
    store.load();
    expect(store.error()).toBeTruthy();
  });

  it('loadBackoffice() charge les shows backoffice', () => {
    boService.getShows.mockReturnValue(of([boShow]));
    store.loadBackoffice();
    expect(store.backofficeShows()).toHaveLength(1);
  });

  it('create() ajoute le show à la liste', async () => {
    const created = makeShow(5);
    showService.create.mockReturnValue(of(created));
    await store.create({ date: '2025-06-01T20:00:00.000Z', venueId: 1 });
    expect(store.shows()).toContainEqual(created);
  });

  it('remove() retire le show de la liste', async () => {
    showService.getAll.mockReturnValue(of([makeShow(1), makeShow(2)]));
    store.load();
    showService.remove.mockReturnValue(of(undefined as unknown as void));
    await store.remove(1);
    expect(store.shows().find((s) => s.id === 1)).toBeUndefined();
  });
});
