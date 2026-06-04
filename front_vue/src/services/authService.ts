import { api } from './api'
import type { AuthResponse, MfaVerifyResponse } from '@portfolio/shared'

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  verifyMfa: (userId: number, token: string) =>
    api.post<MfaVerifyResponse>('/mfa/login', { userId, token }),

  setupMfa: () =>
    api.post<{ qrCodeDataURL: string; secret: string }>('/mfa/setup', {}),

  setupMfaWithToken: (setupToken: string) =>
    api.postAs<{ qrCodeDataURL: string; secret: string }>('/mfa/setup', {}, setupToken),

  confirmMfaWithToken: (totpCode: string, setupToken: string) =>
    api.postAs<{ verified: boolean; token: string }>('/mfa/verify', { token: totpCode }, setupToken),

  confirmMfa: (token: string) =>
    api.post<{ verified: boolean; token: string }>('/mfa/verify', { token }),

  register: (email: string, password: string, isAdmin = false) =>
    api.post<{ id: number; email: string }>('/auth/register', { email, password, isAdmin }),
}
