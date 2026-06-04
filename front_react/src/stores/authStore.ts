import { create } from 'zustand'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  setToken: (token: string) => void
  logout: () => void
}

function decodeIsAdmin(token: string): boolean {
  try {
    return JSON.parse(atob(token.split('.')[1])).role === 'ADMIN'
  } catch {
    return false
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const stored = sessionStorage.getItem('token')
  return {
    token: stored,
    isAuthenticated: stored !== null,
    isAdmin: stored ? decodeIsAdmin(stored) : false,

    setToken(token: string) {
      sessionStorage.setItem('token', token)
      set({ token, isAuthenticated: true, isAdmin: decodeIsAdmin(token) })
    },

    logout() {
      sessionStorage.removeItem('token')
      set({ token: null, isAuthenticated: false, isAdmin: false })
    },
  }
})
