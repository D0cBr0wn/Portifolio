import { api } from './api'
import type { AuthResponse, MfaVerifyResponse } from '@portfolio/shared'

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  verifyMfa: (userId: number, token: string) =>
    api.post<MfaVerifyResponse>('/mfa/verify', { userId, token }),
}
