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
      :items="store.backofficeVenues"
      :loading="store.loading"
      loading-text="Chargement des lieux..."
      no-data-text="Aucun lieu enregistré."
      item-value="id"
    >
      <template #item.address="{ item }">
        {{ [item.address1, item.zipCode, item.city].filter(Boolean).join(', ') || '—' }}
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
          <VenueForm :loading="store.loading" @submit="handleCreate" @cancel="dialog = false" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog édition -->
    <v-dialog v-model="editDialog" max-width="600">
      <v-card>
        <v-card-text class="pt-4">
          <VenueForm
            :initial="editingVenue ?? undefined"
            :loading="store.loading"
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
          Supprimer le lieu <strong>{{ deleteTarget?.name }}</strong> ?
          <br>Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" :loading="store.loading" @click="handleDelete">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import VenueForm from '@/components/backoffice/VenueForm.vue'
import { useVenueStore } from '@/stores/venueStore'
import type { VenueWithCreator, VenueData } from '@portfolio/shared'

const store = useVenueStore()
const dialog = ref(false)
const editDialog = ref(false)
const editingVenue = ref<VenueWithCreator | null>(null)
const deleteDialog = ref(false)
const deleteTarget = ref<VenueWithCreator | null>(null)

const headers = [
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Ville', key: 'city', sortable: true },
  { title: 'Adresse', key: 'address', sortable: false },
  { title: 'Créé par', key: 'createdBy', sortable: false },
  { title: 'Créé le', key: 'createdAt', sortable: true },
  { title: '', key: 'actions', sortable: false },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(() => {
  store.loadBackoffice()
  store.load()
})

async function handleCreate(data: Omit<VenueData, 'id'>) {
  await store.create(data)
  if (!store.error) {
    dialog.value = false
    store.loadBackoffice()
  }
}

function openEdit(venue: VenueWithCreator) {
  editingVenue.value = venue
  editDialog.value = true
}

async function handleEdit(data: Omit<VenueData, 'id'>) {
  if (!editingVenue.value) return
  await store.update(editingVenue.value.id, data)
  if (!store.error) {
    editDialog.value = false
    store.loadBackoffice()
  }
}

function openDelete(venue: VenueWithCreator) {
  deleteTarget.value = venue
  deleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  await store.remove(deleteTarget.value.id)
  if (!store.error) {
    deleteDialog.value = false
    store.loadBackoffice()
  }
}
</script>
