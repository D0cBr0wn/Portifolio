import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ContactService } from './contact.service';

const BASE = 'http://localhost:3000/api';
const payload = { name: 'Alice', email: 'alice@example.com', message: 'Bonjour !' };
const response = { id: 1, ...payload, createdAt: '2025-06-01T10:00:00.000Z' };

describe('ContactService', () => {
  let service: ContactService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ContactService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sendMessage() POST /contact et retourne le message créé', (done) => {
    service.sendMessage(payload).subscribe((msg) => {
      expect(msg.id).toBe(1);
      expect(msg.name).toBe('Alice');
      done();
    });
    const req = http.expectOne(`${BASE}/contact`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(response);
  });

  it('getMessages() GET /contact et retourne la liste', (done) => {
    service.getMessages().subscribe((msgs) => {
      expect(msgs).toHaveLength(1);
      expect(msgs[0].email).toBe('alice@example.com');
      done();
    });
    const req = http.expectOne(`${BASE}/contact`);
    expect(req.request.method).toBe('GET');
    req.flush([response]);
  });

  it('deleteMessage() DELETE /contact/:id avec statut 204', (done) => {
    service.deleteMessage(1).subscribe(() => done());
    const req = http.expectOne(`${BASE}/contact/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
