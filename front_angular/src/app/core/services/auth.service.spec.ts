import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

const BASE = 'http://localhost:3000/api';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login() POST /auth/login avec email + password', (done) => {
    service.login('a@b.com', 'pass').subscribe((res) => {
      expect(res.token).toBe('tok123');
      done();
    });
    const req = http.expectOne(`${BASE}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'pass' });
    req.flush({ token: 'tok123' });
  });

  it('login() transmet mfaRequired quand MFA requis', (done) => {
    service.login('a@b.com', 'pass').subscribe((res) => {
      expect(res.mfaRequired).toBe(true);
      done();
    });
    http.expectOne(`${BASE}/auth/login`).flush({ mfaRequired: true, userId: 42 });
  });

  it('register() POST /auth/register', (done) => {
    service.register('a@b.com', 'pass').subscribe((res) => {
      expect(res.id).toBe(1);
      done();
    });
    const req = http.expectOne(`${BASE}/auth/register`);
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'pass', isAdmin: false });
    req.flush({ id: 1, email: 'a@b.com' });
  });

  it('verifyMfa() POST /mfa/login avec Bearer token + code', (done) => {
    service.verifyMfa('pending-jwt', '123456').subscribe((res) => {
      expect(res.verified).toBe(true);
      expect(res.token).toBe('jwt');
      done();
    });
    const req = http.expectOne(`${BASE}/mfa/login`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer pending-jwt');
    expect(req.request.body).toEqual({ token: '123456' });
    req.flush({ verified: true, token: 'jwt' });
  });
});
