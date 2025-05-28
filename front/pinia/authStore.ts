import { defineStore } from "pinia";
import { ref } from "vue";

import type { LoginPayload, MfaVerifyPayload } from "~/model/types/Payloads";
import type {
  LoginResponse,
  MfaResponse,
  MfasetupNeededResponse,
  MfasetupResponse,
} from "~/model/types/Response";

export const useAuthStore = defineStore("auth", () => {
  const config = useRuntimeConfig();
  const token = ref<string | null>(null);
  const mfaSetupToken = ref<string | null>(null);
  const mfaVerifyToken = ref<string | null>(null);
  const displayMfa = ref<boolean>(false);
  const configureMfa = ref<boolean>(false);
  const qrCode = ref<string | null>(null);

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
        mfaVerifyToken.value = response?.token;
        displayMfa.value = true;
        return;
      }

      //mfa need to be setup
      if (response?.mfaSetupRequired) {
        mfaSetupToken.value = response?.token;
        configureMfa.value = true;
        const setupResponse: MfasetupResponse = await $fetch(
          `${config.public.apiBase}/mfa/setup`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${mfaSetupToken.value}`,
            },
            body: { email: payload.email, token: token.value },
          }
        );

        qrCode.value = setupResponse.qrCodeDataURL;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const verifyMfa = async (mfa: MfaVerifyPayload) => {
    try {
      const router = useRouter();

      token.value = await $fetch(`${config.public.apiBase}/mfa/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mfaSetupToken.value}`,
        },
        body: mfa,
      });

      if (token.value) {
        router.push("/auboulot/shows");
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Retourner les valeurs et les actions
  return {
    login,
    displayMfa,
    configureMfa,
    verifyMfa,
    qrCode,
  };
});
