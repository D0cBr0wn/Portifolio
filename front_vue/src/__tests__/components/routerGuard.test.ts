import { describe, it, expect, beforeEach } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../../stores/authStore'
import { defineComponent } from 'vue'

const Stub = defineComponent({ template: '<div />' })

function buildRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', component: Stub },
      { path: '/shows', component: Stub },
      {
        path: '/backoffice',
        meta: { requiresAuth: true },
        children: [
          { path: 'venues', component: Stub },
          { path: 'shows', component: Stub },
        ],
      },
    ],
  })
}

describe('Route guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
  })

  it('redirige vers /login si non authentifié sur une route protégée', async () => {
    const router = buildRouter()
    const auth = useAuthStore()

    router.beforeEach((to) => {
      if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login'
    })

    await router.push('/backoffice/venues')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('accède à la route protégée si authentifié', async () => {
    const router = buildRouter()
    const auth = useAuthStore()
    auth.setToken('valid-token')

    router.beforeEach((to) => {
      if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login'
    })

    await router.push('/backoffice/venues')
    expect(router.currentRoute.value.path).toBe('/backoffice/venues')
  })

  it('les routes publiques sont accessibles sans token', async () => {
    const router = buildRouter()
    router.beforeEach((to) => {
      const auth = useAuthStore()
      if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login'
    })

    await router.push('/shows')
    expect(router.currentRoute.value.path).toBe('/shows')
  })
})
