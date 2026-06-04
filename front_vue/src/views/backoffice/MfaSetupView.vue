<template>
  <AdminLayout>
    <div class="mb-6">
      <h1 class="text-h5">Sécurité — Authentification MFA</h1>
    </div>

    <!-- Étape 1 : activation -->
    <v-card max-width="480" v-if="step === 'init'">
      <v-card-text>
        <p class="mb-4">
          Activez l'authentification à deux facteurs (TOTP) pour sécuriser votre compte.
          Vous aurez besoin de l'application <strong>Google Authenticator</strong> ou équivalente.
        </p>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" :loading="loading" @click="startSetup">
          Activer le MFA
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Étape 2 : scan QR code -->
    <v-card max-width="480" v-else-if="step === 'qr'">
      <v-card-text>
        <p class="mb-4">Scannez ce QR code avec votre application d'authentification :</p>
        <div class="d-flex justify-center mb-4">
          <img :src="qrCodeDataURL" alt="QR code MFA" style="width: 200px; height: 200px;" />
        </div>
        <p class="text-caption text-medium-emphasis mb-4">
          Code manuel : <code>{{ secret }}</code>
        </p>
        <p class="mb-2">Entrez le code à 6 chiffres pour confirmer :</p>
        <v-otp-input v-model="otpCode" length="6" type="number" class="mb-2" />
        <v-alert v-if="error" type="error" class="mb-2">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" @click="step = 'init'">Annuler</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="otpCode.length < 6"
          @click="confirmSetup"
        >
          Confirmer
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Étape 3 : succès -->
    <v-card max-width="480" v-else-if="step === 'done'">
      <v-card-text>
        <v-alert type="success" class="mb-4">
          MFA activé avec succès ! Votre compte est désormais protégé par un second facteur.
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="router.push('/backoffice/venues')">
          Retour au backoffice
        </v-btn>
      </v-card-actions>
    </v-card>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const step = ref<'init' | 'qr' | 'done'>('init')
const qrCodeDataURL = ref('')
const secret = ref('')
const otpCode = ref('')
const loading = ref(false)
const error = ref('')

async function startSetup() {
  loading.value = true
  error.value = ''
  try {
    const res = await authService.setupMfa()
    qrCodeDataURL.value = res.qrCodeDataURL
    secret.value = res.secret
    step.value = 'qr'
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Erreur lors de l\'activation du MFA.'
  } finally {
    loading.value = false
  }
}

async function confirmSetup() {
  if (otpCode.value.length < 6) return
  loading.value = true
  error.value = ''
  try {
    const res = await authService.confirmMfa(otpCode.value)
    if (res.verified) {
      authStore.setToken(res.token)
      step.value = 'done'
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Code invalide. Réessayez.'
    otpCode.value = ''
  } finally {
    loading.value = false
  }
}
</script>
