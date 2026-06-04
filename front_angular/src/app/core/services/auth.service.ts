import { Injectable, inject } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { AuthResponse, MfaVerifyResponse } from '@portfolio/shared';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', { email, password });
  }

  register(email: string, password: string, isAdmin = false): Observable<{ id: number; email: string }> {
    return this.api.post('/auth/register', { email, password, isAdmin });
  }

  verifyMfa(userId: number, token: string): Observable<MfaVerifyResponse> {
    return this.api.post<MfaVerifyResponse>('/mfa/login', { userId, token });
  }

  setupMfa(): Observable<{ qrCodeDataURL: string; secret: string }> {
    return this.api.post('/mfa/setup', {});
  }

  setupMfaWithToken(setupToken: string): Observable<{ qrCodeDataURL: string; secret: string }> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${setupToken}` });
    return this.api.post('/mfa/setup', {}, headers);
  }

  confirmMfa(totpCode: string): Observable<{ verified: boolean; token: string }> {
    return this.api.post('/mfa/verify', { token: totpCode });
  }

  confirmMfaWithToken(totpCode: string, setupToken: string): Observable<{ verified: boolean; token: string }> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${setupToken}` });
    return this.api.post('/mfa/verify', { token: totpCode }, headers);
  }
}
