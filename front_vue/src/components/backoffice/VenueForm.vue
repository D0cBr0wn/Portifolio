<template>
  <v-form @submit.prevent="submit" ref="formRef">
    <p class="text-h6 mb-4" data-testid="venue-dialog-title">{{ initial ? 'Modifier le lieu' : 'Nouveau lieu' }}</p>
    <v-row>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="form.name"
          label="Nom du lieu *"
          variant="outlined"
          density="comfortable"
          :rules="[required]"
          data-testid="venue-name-input"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="form.city"
          label="Ville *"
          variant="outlined"
          density="comfortable"
          :rules="[required]"
          data-testid="venue-city-input"
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
      <v-btn type="submit" color="primary" :loading="loading" data-testid="save-btn">Enregistrer</v-btn>
      <v-btn variant="text" @click="$emit('cancel')">Annuler</v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { Venue, VenueData } from '@portfolio/shared'

const props = defineProps<{ loading?: boolean; initial?: Venue }>()

const emit = defineEmits<{
  submit: [data: Omit<VenueData, 'id'>]
  cancel: []
}>()

const formRef = ref()
const form = reactive({ name: '', city: '', address1: '', zipCode: '' })

onMounted(() => {
  if (props.initial) {
    Object.assign(form, {
      name: props.initial.name,
      city: props.initial.city,
      address1: props.initial.address1 ?? '',
      zipCode: props.initial.zipCode ?? '',
    })
  }
})

const required = (v: string) => !!v || 'Champ requis'

async function submit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  emit('submit', { ...form })
  if (!props.initial) {
    Object.assign(form, { name: '', city: '', address1: '', zipCode: '' })
  }
}
</script>
