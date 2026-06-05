<template>
  <v-form @submit.prevent="submit" ref="formRef">
    <p class="text-h6 mb-4" data-testid="show-dialog-title">{{ initial ? 'Modifier le concert' : 'Nouveau concert' }}</p>
    <v-row>
      <v-col cols="12" sm="7">
        <v-text-field
          v-model="form.label"
          label="Nom du concert"
          variant="outlined"
          density="comfortable"
          data-testid="show-label-input"
        />
      </v-col>
      <v-col cols="12" sm="5">
        <v-text-field
          v-model="form.date"
          label="Date *"
          type="datetime-local"
          variant="outlined"
          density="comfortable"
          :rules="[required]"
          data-testid="show-date-input"
        />
      </v-col>
      <v-col cols="12">
        <v-select
          v-model="form.venueId"
          :items="venues"
          item-title="name"
          item-value="id"
          label="Lieu *"
          placeholder="Choisir un lieu"
          variant="outlined"
          density="comfortable"
          :rules="[requiredVenue]"
          no-data-text="Aucun lieu disponible — créez-en un d'abord."
        />
      </v-col>
      <v-col cols="12">
        <v-textarea
          v-model="form.details"
          label="Détails"
          variant="outlined"
          density="comfortable"
          rows="3"
          auto-grow
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
import { ref, reactive, onMounted } from 'vue'
import type { Venue, Show, ShowData } from '@portfolio/shared'

const props = defineProps<{ venues: Venue[]; loading?: boolean; initial?: Show }>()

const emit = defineEmits<{
  submit: [data: Omit<ShowData, 'id' | 'venue'>]
  cancel: []
}>()

const formRef = ref()
const form = reactive({
  label: '',
  date: '',
  venueId: null as number | null,
  details: '',
})

onMounted(() => {
  if (props.initial) {
    const d = props.initial.date
    const pad = (n: number) => String(n).padStart(2, '0')
    const localStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    Object.assign(form, {
      label: props.initial.label ?? '',
      date: localStr,
      venueId: props.initial.venueId,
      details: props.initial.details ?? '',
    })
  }
})

const required = (v: string) => !!v || 'Champ requis'
const requiredVenue = (v: number | null) => v !== null || 'Champ requis'

async function submit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  emit('submit', {
    label: form.label || undefined,
    details: form.details || undefined,
    date: new Date(form.date).toISOString(),
    venueId: form.venueId!,
  })
  if (!props.initial) {
    Object.assign(form, { label: '', date: '', venueId: null, details: '' })
  }
}
</script>
