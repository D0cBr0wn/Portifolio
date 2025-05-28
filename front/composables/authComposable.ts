import { useAuthStore } from "~/pinia/authStore";
import { useRouter } from "vue-router";
import type { LoginPayload, MfaVerifyPayload } from "~/model/types/Payloads";

export const useAuth = () => {
  const loading = ref<boolean>(false);
  const store = useAuthStore();
  const router = useRouter();

  const login = async (loginPayload: LoginPayload) => {
    try {
      loading.value = true;

      const response = await store.login(loginPayload);

      if (response) {
        return router.push("/auboulot/shows");
      }
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  };

  const verifyMfa = async (mfa: MfaVerifyPayload) => {
    try {
      loading.value = true;
      await store.verifyMfa(mfa);
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    login,
    verifyMfa,
  };
};
