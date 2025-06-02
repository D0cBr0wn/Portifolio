import { useAuthStore } from "~/pinia/authStore";
import { useRouter } from "vue-router";
import type { LoginPayload, MfaVerifyPayload } from "~/model/types/Payloads";

export const useAuth = () => {
  const loading = ref<boolean>(false);
  const mfaPayload = ref<MfaVerifyPayload>({ token: undefined, email: null });
  const authError = ref<string | undefined>(undefined);
  const store = useAuthStore();
  const router = useRouter();

  const login = async (loginPayload: LoginPayload) => {
    try {
      loading.value = true;

      await store.login(loginPayload);
    } catch (error) {
      handleAuthError(error as string);
      console.error(error);
    } finally {
      loading.value = false;
    }
  };

  const verifyMfa = async (mfa: MfaVerifyPayload) => {
    try {
      loading.value = true;
      const response = await store.verifyMfa(mfa);

      if (response) {
        return router.push("/auboulot/shows");
      }
    } catch (error) {
      handleAuthError(error as string, false);
      console.error(error);
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    try {
      loading.value = true;
      store.logout();
      return router.push("/auboulot");
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  };

  const handleAuthError = (error: string, redirect: boolean = true) => {
    authError.value = error;
    console.warn("calles", authError.value);

    if (redirect) logout();
  };

  return {
    loading,
    login,
    verifyMfa,
    logout,
    mfaPayload,
    authError,
  };
};
