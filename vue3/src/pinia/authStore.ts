import { defineStore } from "pinia";
import { ref, watch } from "vue";
import axios from "axios";

import type { LoginPayload, MfaVerifyPayload } from "@/model/types/Payloads";

import type {
  LoginResponse,
  MfaResponse,
  MfasetupNeededResponse,
  MfaSetupResponse,
  MfaVerifiedResponse,
} from "@/model/types/Response";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);
  const mfaTempToken = ref<string | null>(null);
  const displayMfa = ref(false);
  const configureMfa = ref(false);
  const qrCode = ref<string | null>(null);

  // Hydrate depuis sessionStorage
  if (typeof window !== "undefined") {
    token.value = sessionStorage.getItem("token");
  }

  const login = async (payload: LoginPayload): Promise<void> => {
    try {
      const { data } = await axios.post<
        LoginResponse | MfaResponse | MfasetupNeededResponse
      >(`${API_BASE_URL}/auth/login`, payload);

      if ("mfaRequired" in data && data.mfaRequired) {
        mfaTempToken.value = data.token;
        displayMfa.value = true;
        return;
      }

      if ("mfaSetupRequired" in data && data.mfaSetupRequired) {
        mfaTempToken.value = data.token;
        configureMfa.value = true;

        const { data: setupData } = await axios.post<MfaSetupResponse>(
          `${API_BASE_URL}/mfa/setup`,
          { email: payload.email },
          {
            headers: {
              Authorization: `Bearer ${mfaTempToken.value}`,
            },
          }
        );

        qrCode.value = setupData.qrCodeDataURL;
        return;
      }

      // Auth direct sans MFA
      if ("token" in data) {
        token.value = data.token;
      }
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  const verifyMfa = async (payload: MfaVerifyPayload): Promise<boolean> => {
    try {
      const { data } = await axios.post<MfaVerifiedResponse>(
        `${API_BASE_URL}/mfa/verify`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${mfaTempToken.value}`,
          },
        }
      );

      if (data.token && data.verified) {
        token.value = data.token;
        return true;
      }

      return false;
    } catch (err) {
      console.error("MFA verification failed:", err);
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

  watch(token, (newToken) => {
    if (typeof window === "undefined") return;
    if (newToken) {
      sessionStorage.setItem("token", newToken);
    } else {
      sessionStorage.removeItem("token");
    }
  });

  return {
    token,
    mfaTempToken,
    displayMfa,
    configureMfa,
    qrCode,
    login,
    verifyMfa,
    logout,
  };
});
