<template>
  <div class="login-page">
    <v-card class="login-card" elevation="8">
      <v-card-title class="login-title">
        <span v-if="step === 'credentials'">Connexion</span>
        <span v-else>Vérification MFA</span>
      </v-card-title>

      <!-- Étape 1 : email + mot de passe -->
      <v-card-text v-if="step === 'credentials'">
        <v-form @submit.prevent="submitCredentials">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            variant="outlined"
            density="comfortable"
            autocomplete="email"
            :error-messages="errors.email"
            class="mb-3"
          />
          <v-text-field
            v-model="password"
            label="Mot de passe"
            type="password"
            variant="outlined"
            density="comfortable"
            autocomplete="current-password"
            :error-messages="errors.password"
            class="mb-4"
          />
          <v-alert v-if="serverError" type="error" density="compact" class="mb-4">
            {{ serverError }}
          </v-alert>
          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            :loading="loading"
          >
            Se connecter
          </v-btn>
        </v-form>
      </v-card-text>

      <!-- Étape 2 : code Google Authenticator -->
      <v-card-text v-else>
        <p class="mfa-hint">
          Saisissez le code à 6 chiffres affiché dans votre application
          Google Authenticator.
        </p>
        <v-form @submit.prevent="submitMfa">
          <v-otp-input
            v-model="mfaCode"
            length="6"
            type="number"
            class="mb-4"
          />
          <v-alert v-if="serverError" type="error" density="compact" class="mb-4">
            {{ serverError }}
          </v-alert>
          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            :loading="loading"
            :disabled="mfaCode.length < 6"
          >
            Vérifier
          </v-btn>
          <v-btn
            variant="text"
            block
            class="mt-2"
            @click="step = 'credentials'"
          >
            Retour
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'

const router = useRouter()
const authStore = useAuthStore()

const step = ref<'credentials' | 'mfa'>('credentials')
const email = ref('')
const password = ref('')
const mfaCode = ref('')
const loading = ref(false)
const serverError = ref('')
const pendingUserId = ref<number | null>(null)

const errors = ref({ email: '', password: '' })

function validate(): boolean {
  errors.value = { email: '', password: '' }
  if (!email.value) errors.value.email = "L'email est requis"
  if (!password.value) errors.value.password = 'Le mot de passe est requis'
  return !errors.value.email && !errors.value.password
}

async function submitCredentials() {
  if (!validate()) return
  loading.value = true
  serverError.value = ''
  try {
    const res = await authService.login(email.value, password.value)
    if (res.mfaRequired && res.userId) {
      pendingUserId.value = res.userId
      step.value = 'mfa'
    } else if (res.token) {
      authStore.setToken(res.token)
      router.push('/backoffice/venues')
    }
  } catch {
    serverError.value = 'Identifiants invalides.'
  } finally {
    loading.value = false
  }
}

async function submitMfa() {
  if (!pendingUserId.value || mfaCode.value.length < 6) return
  loading.value = true
  serverError.value = ''
  try {
    const res = await authService.verifyMfa(pendingUserId.value, mfaCode.value)
    authStore.setToken(res.token)
    router.push('/backoffice/venues')
  } catch {
    serverError.value = 'Code invalide. Réessayez.'
    mfaCode.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #2a2a2a !important;
}

.login-title {
  font-size: 1.4rem;
  font-weight: 400;
  padding: 1.5rem 1.5rem 0;
  color: #BB86FC;
}

.mfa-hint {
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}
</style>
