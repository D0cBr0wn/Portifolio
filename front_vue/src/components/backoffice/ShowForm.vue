<template>
  <v-form @submit.prevent="submit" ref="formRef">
    <v-row>
      <v-col cols="12" sm="7">
        <v-text-field
          v-model="form.label"
          label="Nom du concert *"
          variant="outlined"
          density="comfortable"
          :rules="[required]"
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
        />
      </v-col>
      <v-col cols="12">
        <v-select
          v-model="form.venueId"
          :items="venues"
          item-title="name"
          item-value="id"
          label="Lieu *"
          variant="outlined"
          density="comfortable"
          :rules="[requiredNum]"
          no-data-text="Aucun lieu disponible — créez-en un d'abord."
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
import type { Venue, ShowData } from '@portfolio/shared'

const emit = defineEmits<{
  submit: [data: Omit<ShowData, 'id' | 'venue'>]
  cancel: []
}>()

defineProps<{ venues: Venue[]; loading?: boolean }>()

const formRef = ref()
const form = reactive({ label: '', date: '', venueId: 0 })

const required = (v: string) => !!v || 'Champ requis'
const requiredNum = (v: number) => v > 0 || 'Champ requis'

async function submit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  emit('submit', {
    label: form.label,
    date: new Date(form.date).toISOString(),
    venueId: form.venueId,
  })
  Object.assign(form, { label: '', date: '', venueId: 0 })
}
</script>
