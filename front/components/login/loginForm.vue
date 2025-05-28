<template>
  <div class="form-wrapper">
    <v-card class="login-form" elevation="6">
      <v-card-title class="text-h6">Please Login</v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="onSubmit">
          <div v-if="!store.displayMfa && !store.qrCode" class="login-part">
            <v-text-field
              v-model="email"
              label="Email"
              :rules="emailRules"
              prepend-icon="mdi-email"
              type="email"
              required
            />
            <v-text-field
              v-model="password"
              label="Mot de passe"
              :rules="passwordRules"
              prepend-icon="mdi-lock"
              type="password"
              required
            />
          </div>
          <div v-if="store.qrCode" class="mfa-setup">
            <pre>coucou {{ store.displayMfa }} {{ mfa.token }}</pre>
            <img :src="store.qrCode" alt="QR Code MFA" class="w-48 h-48" />
            <v-text-field
              v-model="mfa.token"
              label="MCode de vérification"
              :rules="mfaRules"
              prepend-icon="mdi-lock"
              type="number"
              required
            />
          </div>

          <div v-if="store.displayMfa" class="mfa">
            mfa
            <v-text-field
              v-model="mfa.token"
              label="MCode de vérification"
              :rules="mfaRules"
              prepend-icon="mdi-lock"
              type="number"
              required
            />
          </div>
          <v-btn
            :loading="loading"
            color="primary"
            type="submit"
            block
            class="mt-4"
          >
            Se connecter
          </v-btn>
          <v-alert v-if="error" type="error" class="mt-4" dense>{{
            error
          }}</v-alert>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "~/pinia/authStore";
import { useAuth } from "../../composables/authComposable";
import type { MfaVerifyPayload } from "~/model/types/Payloads";

const { login, loading, verifyMfa } = useAuth();
const email = ref<string>("");
const password = ref<string>("");
const mfa = ref<MfaVerifyPayload>({ token: null });
const valid = ref<boolean>(false);
const error = ref<string>("");

const store = useAuthStore();

const emailRules = [(v: string) => !!v || "Email requis"];
const passwordRules = [(v: string) => !!v || "Mot de passe requis"];
const mfaRules = [(v: number) => !!v || "Code de verification requis"];

const onSubmit = async () => {
  if (!valid.value) return;

  error.value = "";

  if (!store.displayMfa && !store.qrCode) {
    return await login({
      email: email.value,
      password: password.value,
    });
  }

  if (
    (store.displayMfa && mfa.value.token) ||
    (store.qrCode && mfa.value.token)
  ) {
    await verifyMfa(mfa.value);
  }
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
</style>
