<template>
  <div class="register-page">
    <v-card class="register-card" elevation="8">
      <v-card-title class="register-title">Créer un compte</v-card-title>

      <v-card-text>
        <v-alert type="warning" variant="tonal" class="mb-4" density="compact">
          Cette page est disponible <strong>uniquement pour la démonstration</strong>.<br>
          Elle n'existe pas en production.
        </v-alert>

        <div v-if="success">
          <v-alert type="success" class="mb-4">
            Compte créé avec succès ! Vous pouvez maintenant vous connecter.
          </v-alert>
          <v-btn color="primary" block :to="'/login'">Se connecter</v-btn>
        </div>

        <v-form v-else @submit.prevent="submit">
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
            autocomplete="new-password"
            :error-messages="errors.password"
            class="mb-3"
          />
          <v-text-field
            v-model="confirm"
            label="Confirmer le mot de passe"
            type="password"
            variant="outlined"
            density="comfortable"
            autocomplete="new-password"
            :error-messages="errors.confirm"
            class="mb-4"
          />
          <v-alert v-if="serverError" type="error" density="compact" class="mb-4">
            {{ serverError }}
          </v-alert>
          <v-btn type="submit" color="primary" block size="large" :loading="loading">
            Créer le compte
          </v-btn>
        </v-form>
      </v-card-text>

      <v-card-text class="text-center pt-0">
        <router-link to="/login" class="text-caption text-medium-emphasis">
          Déjà un compte ? Se connecter
        </router-link>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '@/services/authService'

const email = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const serverError = ref('')
const success = ref(false)
const errors = ref({ email: '', password: '', confirm: '' })

function validate(): boolean {
  errors.value = { email: '', password: '', confirm: '' }
  if (!email.value) errors.value.email = "L'email est requis"
  if (!password.value || password.value.length < 6) errors.value.password = 'Minimum 6 caractères'
  if (password.value !== confirm.value) errors.value.confirm = 'Les mots de passe ne correspondent pas'
  return !errors.value.email && !errors.value.password && !errors.value.confirm
}

async function submit() {
  if (!validate()) return
  loading.value = true
  serverError.value = ''
  try {
    await authService.register(email.value, password.value)
    success.value = true
  } catch (e: unknown) {
    serverError.value = e instanceof Error ? e.message : 'Erreur lors de la création du compte.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
}

.register-card {
  width: 100%;
  max-width: 420px;
  background: #2a2a2a !important;
}

.register-title {
  font-size: 1.4rem;
  font-weight: 400;
  padding: 1.5rem 1.5rem 0;
  color: var(--color-accent-alt);
}
</style>
