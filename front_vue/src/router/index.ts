import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/shows',
      component: () => import('@/views/ShowsView.vue'),
    },
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/register',
      component: () => import('@/views/RegisterView.vue'),
    },
    {
      path: '/backoffice',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'venues',
          component: () => import('@/views/backoffice/VenuesView.vue'),
        },
        {
          path: 'shows',
          component: () => import('@/views/backoffice/ShowsView.vue'),
        },
        {
          path: 'mfa-setup',
          component: () => import('@/views/backoffice/MfaSetupView.vue'),
        },
        {
          path: 'users',
          meta: { requiresAdmin: true },
          component: () => import('@/views/backoffice/UsersView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login'
  if (to.meta.requiresAdmin && !auth.isAdmin) return '/backoffice/venues'
  return true
})

export default router
