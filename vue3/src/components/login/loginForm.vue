<template>
  <div class="form-wrapper">
    <v-card class="login-form" elevation="6">
      <v-card-title class="text-h6">Admin access</v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="onSubmit">
          <div v-if="!isMfa" class="login-part">
            <alert :msg="authError" />
            <v-text-field
              v-model="email"
              label="Email"
              :rules="emailRules"
              prepend-icon="mdi-email"
              type="email"
              required
              @input="authError = undefined"
            />
            <v-text-field
              v-model="password"
              label="Mot de passe"
              :rules="passwordRules"
              prepend-icon="mdi-lock"
              type="password"
              required
              @input="authError = undefined"
            />
          </div>

          <!-- MFA handling -->
          <mfa-handler
            v-else
            v-model="mfaPayload.token"
            :auth-error="authError"
            :qr-code="store.qrCode"
            @back="back()"
          />

          <v-btn
            :loading="loading"
            color="primary"
            type="submit"
            block
            class="mt-4"
          >
            Se connecter
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "../../pinia/authStore";
import { useAuth } from "../../composables/authComposable";
import Alert from "../adapters/Alert.vue";

// store
const store = useAuthStore();
// composables
const { login, loading, verifyMfa, authError, mfaPayload, logout } = useAuth();

// datas
const email = ref<string>("");
const password = ref<string>("");
const valid = ref<boolean>(false);
const error = ref<string>("");
const emailRules = [
  (v: string) => !!v || "Email requis",
  (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Adresse email invalide",
];
const passwordRules = [(v: string) => !!v || "Mot de passe requis"];

// computed
const isMfa = computed(() => {
  return store.displayMfa || store.qrCode;
});

// methods
const onSubmit = async () => {
  if (!valid.value) return;
  authError.value = undefined;

  if (!store.displayMfa && !store.qrCode) {
    return await login({
      email: email.value,
      password: password.value,
    });
  }

  if (
    (store.displayMfa && mfaPayload.value.token) ||
    (store.qrCode && mfaPayload.value.token)
  ) {
    mfaPayload.value.email = email.value;
    await verifyMfa(mfaPayload.value);
  }
};

const back = () => {
  authError.value = undefined;
  logout();
};
</script>

<style lang="scss" scoped>
.form-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 5rem;
}
.login-form {
  width: 40rem;
}

.error-alert {
  margin-bottom: 2rem;
}
</style>
