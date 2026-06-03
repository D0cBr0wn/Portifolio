<template>
  <v-form @submit.prevent="submit" ref="formRef">
    <v-row>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="form.name"
          label="Nom du lieu *"
          variant="outlined"
          density="comfortable"
          :rules="[required]"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="form.city"
          label="Ville *"
          variant="outlined"
          density="comfortable"
          :rules="[required]"
        />
      </v-col>
      <v-col cols="12" sm="8">
        <v-text-field
          v-model="form.address1"
          label="Adresse"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field
          v-model="form.zipCode"
          label="Code postal"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
    </v-row>
    <div class="d-flex gap-2 mt-2">
      <v-btn type="submit" color="primary" :loading="loading">Enregistrer</v-btn>
      <v-btn variant="text" @click="$emit('cancel')">Annuler</v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { VenueData } from '@portfolio/shared'

const emit = defineEmits<{
  submit: [data: Omit<VenueData, 'id'>]
  cancel: []
}>()

defineProps<{ loading?: boolean }>()

const formRef = ref()
const form = reactive({ name: '', city: '', address1: '', zipCode: '' })

const required = (v: string) => !!v || 'Champ requis'

async function submit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  emit('submit', { ...form })
  Object.assign(form, { name: '', city: '', address1: '', zipCode: '' })
}
</script>
