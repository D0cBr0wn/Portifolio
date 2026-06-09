<template>
  <PublicLayout>
    <h1 class="page-title" data-testid="contact-heading">Contact</h1>

    <div class="contact-wrapper">
      <v-alert
        v-if="success"
        type="success"
        class="mb-6"
        data-testid="contact-success"
        closable
        @click:close="success = false"
      >
        Votre message a bien été envoyé.
      </v-alert>

      <v-alert
        v-if="errorMessage"
        type="error"
        class="mb-6"
        data-testid="contact-error"
        closable
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>

      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-text-field
          v-model="form.name"
          label="Nom"
          :rules="[rules.required, rules.maxName]"
          :disabled="loading"
          variant="outlined"
          class="mb-2"
          data-testid="contact-name"
        />
        <v-text-field
          v-model="form.email"
          label="Email"
          type="email"
          :rules="[rules.required, rules.email]"
          :disabled="loading"
          variant="outlined"
          class="mb-2"
          data-testid="contact-email"
        />
        <v-textarea
          v-model="form.message"
          label="Message"
          :rules="[rules.required, rules.maxMessage]"
          :disabled="loading"
          variant="outlined"
          rows="5"
          class="mb-4"
          data-testid="contact-message"
        />
        <v-btn
          type="submit"
          color="primary"
          :loading="loading"
          data-testid="contact-submit"
        >
          Envoyer
        </v-btn>
      </v-form>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import { contactService } from '@/services/contactService'

const formRef = ref()
const loading = ref(false)
const success = ref(false)
const errorMessage = ref('')

const form = ref({ name: '', email: '', message: '' })

const rules = {
  required: (v: string) => !!v?.trim() || 'Champ requis',
  maxName: (v: string) => (v?.length ?? 0) <= 100 || 'Maximum 100 caractères',
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email invalide',
  maxMessage: (v: string) => (v?.length ?? 0) <= 2000 || 'Maximum 2000 caractères',
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  errorMessage.value = ''
  success.value = false

  try {
    await contactService.sendMessage(form.value)
    success.value = true
    form.value = { name: '', email: '', message: '' }
    formRef.value.resetValidation()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page-title {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: 2rem;
}

.contact-wrapper {
  max-width: 600px;
}
</style>
