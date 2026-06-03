import { useAuthStore } from '@/stores/authStore'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = useAuthStore()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (response.status === 401) {
    auth.logout()
    window.location.href = '/login'
    throw new Error('Session expirée')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? `Erreur ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}
