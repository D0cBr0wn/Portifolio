import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(sessionStorage.getItem('token'))

  const isAuthenticated = computed(() => token.value !== null)

  const isAdmin = computed(() => {
    if (!token.value) return false
    try {
      return JSON.parse(atob(token.value.split('.')[1])).role === 'ADMIN'
    } catch { return false }
  })

  function setToken(newToken: string) {
    token.value = newToken
    sessionStorage.setItem('token', newToken)
  }

  function logout() {
    token.value = null
    sessionStorage.removeItem('token')
  }

  return { token, isAuthenticated, isAdmin, setToken, logout }
})
