import { useAuthStore } from "~/pinia/authStore";

export default defineNuxtPlugin((nuxtApp) => {
  const auth = useAuthStore();
  const router = useRouter();

  nuxtApp.$fetch = $fetch.create({
    onRequest({ options }) {
      // Si pas déjà un Headers, on crée une instance propre
      const headers = new Headers(options.headers);

      if (auth.token) {
        console.warn("ajout du token !)");
        headers.set("Authorization", `Bearer ${auth.token}`);
      }

      options.headers = headers;
    },

    onResponseError({ response }) {
      if (response.status === 401 || response.status === 403) {
        auth.logout();
        router.push("/login");
      }
    },
  });
});
