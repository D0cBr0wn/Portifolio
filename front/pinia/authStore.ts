import { defineStore } from "pinia";
import { ref, watch } from "vue";

import type { LoginPayload, MfaVerifyPayload } from "~/model/types/Payloads";
import type {
  LoginResponse,
  MfaResponse,
  MfasetupNeededResponse,
  MfasetupResponse,
  MfaVerifiedResponse,
} from "~/model/types/Response";

export const useAuthStore = defineStore("auth", () => {
  const config = useRuntimeConfig();
  const token = ref<string | null>(null);
  const mfaTempToken = ref<string | null>(null);
  const displayMfa = ref<boolean>(false);
  const configureMfa = ref<boolean>(false);
  const qrCode = ref<string | null>(null);

  if (import.meta.client) {
    token.value = sessionStorage.getItem("token");
  }

  // Actions
  const login = async (payload: LoginPayload) => {
    try {
      const response: LoginResponse | MfaResponse | MfasetupNeededResponse =
        await $fetch(`${config.public.apiBase}/auth/login`, {
          method: "POST",
          body: payload,
        });

      // mfa is setup but need to be verified
      if (response?.mfaRequired) {
        mfaTempToken.value = response?.token;
        displayMfa.value = true;
        return;
      }

      //mfa need to be setup
      if (response?.mfaSetupRequired) {
        mfaTempToken.value = response?.token;
        configureMfa.value = true;
        const setupResponse: MfasetupResponse = await $fetch(
          `${config.public.apiBase}/mfa/setup`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${mfaTempToken.value}`,
            },
            body: { email: payload.email },
          }
        );

        qrCode.value = setupResponse.qrCodeDataURL;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const verifyMfa = async (mfaPayload: MfaVerifyPayload) => {
    try {
      const response: MfaVerifiedResponse = await $fetch(
        `${config.public.apiBase}/mfa/verify`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mfaTempToken.value}`,
          },
          body: mfaPayload,
        }
      );

      if (response.token && response.verified) {
        token.value = response.token;
        return true;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const logout = () => {
    token.value = null;
    mfaTempToken.value = null;
    displayMfa.value = false;
    configureMfa.value = false;
    qrCode.value = null;
  };

  //token sync
  watch(token, (newToken) => {
    if (newToken) {
      sessionStorage.setItem("token", newToken);
    } else {
      sessionStorage.removeItem("token");
    }
  });

  return {
    login,
    displayMfa,
    configureMfa,
    verifyMfa,
    qrCode,
    token,
    logout,
  };
});
