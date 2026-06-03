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
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }
})

export default router
