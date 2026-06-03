<template>
  <AdminLayout>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5">Concerts</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">
        Ajouter un concert
      </v-btn>
    </div>

    <v-alert v-if="showStore.error" type="error" class="mb-4">{{ showStore.error }}</v-alert>

    <v-data-table
      :headers="headers"
      :items="showStore.shows"
      :loading="showStore.loading"
      loading-text="Chargement des concerts..."
      no-data-text="Aucun concert enregistré."
      item-value="id"
      :sort-by="[{ key: 'date', order: 'desc' }]"
    >
      <template #item.date="{ item }">
        {{ item.getFormattedDate() }}
      </template>
      <template #item.venue="{ item }">
        {{ item.venue ? `${item.venue.name} — ${item.venue.city}` : '—' }}
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title class="pa-4">Nouveau concert</v-card-title>
        <v-card-text>
          <ShowForm
            :venues="venueStore.venues"
            :loading="showStore.loading"
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
import ShowForm from '@/components/backoffice/ShowForm.vue'
import { useShowStore } from '@/stores/showStore'
import { useVenueStore } from '@/stores/venueStore'
import type { ShowData } from '@portfolio/shared'

const showStore = useShowStore()
const venueStore = useVenueStore()
const dialog = ref(false)

const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Concert', key: 'label', sortable: true },
  { title: 'Lieu', key: 'venue', sortable: false },
]

onMounted(() => {
  showStore.load()
  venueStore.load()
})

async function handleCreate(data: Omit<ShowData, 'id' | 'venue'>) {
  await showStore.create(data)
  if (!showStore.error) dialog.value = false
}
</script>
