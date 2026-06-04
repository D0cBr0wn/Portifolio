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
      :items="showStore.backofficeShows"
      :loading="showStore.loading"
      loading-text="Chargement des concerts..."
      no-data-text="Aucun concert enregistré."
      item-value="id"
      :sort-by="[{ key: 'date', order: 'desc' }]"
    >
      <template #item.date="{ item }">
        {{ formatDate(item.date) }}
      </template>
      <template #item.label="{ item }">
        {{ item.label || '—' }}
      </template>
      <template #item.venue="{ item }">
        {{ item.venue ? `${item.venue.name} — ${item.venue.city}` : '—' }}
      </template>
      <template #item.createdBy="{ item }">
        {{ item.createdBy?.email || '—' }}
      </template>
      <template #item.createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn icon size="small" variant="text" @click="openEdit(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" color="error" @click="openDelete(item)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- Dialog création -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-text class="pt-4">
          <ShowForm
            :venues="venueStore.venues"
            :loading="showStore.loading"
            @submit="handleCreate"
            @cancel="dialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog édition -->
    <v-dialog v-model="editDialog" max-width="600">
      <v-card>
        <v-card-text class="pt-4">
          <ShowForm
            :initial="editingShow ?? undefined"
            :venues="venueStore.venues"
            :loading="showStore.loading"
            @submit="handleEdit"
            @cancel="editDialog = false"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog suppression -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>Confirmer la suppression</v-card-title>
        <v-card-text>
          Supprimer le concert <strong>{{ editingShow?.label || 'sans titre' }}</strong> ?
          <br>Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" :loading="showStore.loading" @click="handleDelete">Supprimer</v-btn>
        </v-card-actions>
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
import type { ShowWithCreator, ShowData } from '@portfolio/shared'

const showStore = useShowStore()
const venueStore = useVenueStore()
const dialog = ref(false)
const editDialog = ref(false)
const editingShow = ref<ShowWithCreator | null>(null)
const deleteDialog = ref(false)
const deleteTarget = ref<ShowWithCreator | null>(null)

const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Concert', key: 'label', sortable: true },
  { title: 'Lieu', key: 'venue', sortable: false },
  { title: 'Créé par', key: 'createdBy', sortable: false },
  { title: 'Créé le', key: 'createdAt', sortable: true },
  { title: '', key: 'actions', sortable: false },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(() => {
  showStore.loadBackoffice()
  venueStore.load()
})

async function handleCreate(data: Omit<ShowData, 'id' | 'venue'>) {
  await showStore.create(data)
  if (!showStore.error) {
    dialog.value = false
    showStore.loadBackoffice()
  }
}

function openEdit(show: ShowWithCreator) {
  editingShow.value = show
  editDialog.value = true
}

async function handleEdit(data: Omit<ShowData, 'id' | 'venue'>) {
  if (!editingShow.value) return
  await showStore.update(editingShow.value.id, data)
  if (!showStore.error) {
    editDialog.value = false
    showStore.loadBackoffice()
  }
}

function openDelete(show: ShowWithCreator) {
  deleteTarget.value = show
  deleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  await showStore.remove(deleteTarget.value.id)
  if (!showStore.error) {
    deleteDialog.value = false
    showStore.loadBackoffice()
  }
}
</script>
