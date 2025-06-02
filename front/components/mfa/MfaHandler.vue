<template>
  <div class="mfa">
    <alert :msg="authError" />

    <div v-if="qrCode" class="setup">
      <alert
        :title="'MFA setup needed'"
        :msg="'Please scan this QR code in your authentification app then fill the 6 digit code provided below.'"
        :type="'info'"
      />

      <div class="qr-code">
        <img :src="qrCode" alt="QR Code MFA" class="w-48 h-48" />
      </div>
    </div>

    <v-text-field
      v-model="token"
      label="Code de vérification"
      :rules="mfaRules"
      maxlength="6"
      prepend-icon="mdi-lock"
      type="text"
      required
    />

    <div class="actions">
      <v-btn
        v-if="authError"
        class="back-btn"
        variant="outlined"
        @click="emit('back')"
        >Back</v-btn
      >
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from "vue";
import Alert from "../adapters/Alert.vue";

const emit = defineEmits(["back"]);

const props = defineProps({
  qrCode: { type: String as PropType<string | null>, default: undefined },
  authError: { type: String, default: undefined },
});

const token = defineModel<string>();

const mfaRules = [
  (v: string) => !!v || "Code de verification requis",
  (v: string) =>
    /^\d{6}$/.test(v) || "Le code doit contenir exactement 6 chiffres",
];
</script>

<style lang="scss" scoped>
.actions,
.back-btn {
  width: 100%;
}

.qr-code {
  display: flex;
  justify-content: center;
}
</style>
