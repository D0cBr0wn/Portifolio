<template>
  <AdminLayout>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5">Lieux de concerts</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">
        Ajouter un lieu
      </v-btn>
    </div>

    <v-alert v-if="store.error" type="error" class="mb-4">{{ store.error }}</v-alert>

    <v-data-table
      :headers="headers"
      :items="store.venues"
      :loading="store.loading"
      loading-text="Chargement des lieux..."
      no-data-text="Aucun lieu enregistré."
      item-value="id"
    >
      <template #item.address="{ item }">
        {{ item.getFullAddress() || '—' }}
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title class="pa-4">Nouveau lieu</v-card-title>
        <v-card-text>
          <VenueForm
            :loading="store.loading"
            @submit="handleCreate"
            @cancel="dialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import VenueForm from '@/components/backoffice/VenueForm.vue'
import { useVenueStore } from '@/stores/venueStore'
import type { VenueData } from '@portfolio/shared'

const store = useVenueStore()
const dialog = ref(false)

const headers = [
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Ville', key: 'city', sortable: true },
  { title: 'Adresse', key: 'address', sortable: false },
]

onMounted(() => store.load())

async function handleCreate(data: Omit<VenueData, 'id'>) {
  await store.create(data)
  if (!store.error) dialog.value = false
}
</script>
