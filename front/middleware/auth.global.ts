import { useAuthStore } from "~/pinia/authStore";

export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore();

  // si la route commence par /auboulot sauf /auboulot (login)
  if (to.path.startsWith("/auboulot") && to.path !== "/auboulot") {
    if (!auth.token) {
      // pas de token => redirige vers la page login
      return navigateTo("/auboulot");
    }
  }
});
