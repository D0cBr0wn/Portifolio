import { useAuthStore } from '@/stores/authStore'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api'

async function request<T>(path: string, options: RequestInit = {}, overrideToken?: string): Promise<T> {
  const auth = useAuthStore()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const token = overrideToken ?? auth.token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })

  // Rediriger vers /login seulement si on avait un token (session expirée)
  if (response.status === 401 && auth.token) {
    auth.logout()
    window.location.href = '/login'
    throw new Error('Session expirée')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error((body as { error?: string; message?: string }).error ?? (body as { message?: string }).message ?? `Erreur ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  postAs: <T>(path: string, body: unknown, token: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
