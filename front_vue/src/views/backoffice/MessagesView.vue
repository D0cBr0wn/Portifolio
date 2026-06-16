<template>
  <AdminLayout>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5">Messages de contact</h1>
    </div>

    <v-alert v-if="error" type="error" class="mb-4" data-testid="load-error">{{ error }}</v-alert>
    <v-alert v-if="deleteError" type="error" class="mb-4" data-testid="delete-error">{{ deleteError }}</v-alert>

    <v-data-table
      :headers="headers"
      :items="messages"
      :loading="loading"
      loading-text="Chargement des messages..."
      no-data-text="Aucun message reçu."
      item-value="id"
      hover
      @click:row="(_: unknown, { item }: { item: ContactMessage }) => openDetail(item)"
    >
      <template #item.createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>
      <template #item.message="{ item }">
        {{ truncate(item.message) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          icon
          size="small"
          variant="text"
          color="error"
          data-testid="delete-row-btn"
          @click.stop="openDelete(item)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- Dialog détail -->
    <v-dialog v-model="detailDialog" max-width="600">
      <v-card v-if="selectedMessage">
        <v-card-title>Message de {{ selectedMessage.name }}</v-card-title>
        <v-card-subtitle>{{ selectedMessage.email }} — {{ formatDate(selectedMessage.createdAt) }}</v-card-subtitle>
        <v-card-text class="pt-4" style="white-space: pre-wrap;">{{ selectedMessage.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false; selectedMessage = null">Fermer</v-btn>
          <v-btn color="error" data-testid="modal-delete-btn" @click="openDelete(selectedMessage)">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog confirmation suppression -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>Confirmer la suppression</v-card-title>
        <v-card-text>
          Supprimer le message de <strong>{{ deleteTarget?.name }}</strong> ?<br>
          Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" data-testid="cancel-delete-btn" @click="closeDeleteDialog">Annuler</v-btn>
          <v-btn color="error" :loading="deleting" data-testid="confirm-delete-btn" @click="handleDelete">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { contactService, type ContactMessage } from '@/services/contactService'

const messages = ref<ContactMessage[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const detailDialog = ref(false)
const selectedMessage = ref<ContactMessage | null>(null)
const deleteDialog = ref(false)
const deleteTarget = ref<ContactMessage | null>(null)
const deleteError = ref<string | null>(null)
const deleting = ref(false)

const headers = [
  { title: 'Date', key: 'createdAt', sortable: true },
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Message', key: 'message', sortable: false },
  { title: '', key: 'actions', sortable: false },
]

onMounted(async () => {
  loading.value = true
  try {
    messages.value = await contactService.getMessages()
  } catch {
    error.value = 'Impossible de charger les messages.'
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function truncate(text: string | null | undefined, max = 100) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

function openDetail(message: ContactMessage) {
  selectedMessage.value = message
  detailDialog.value = true
}

function openDelete(message: ContactMessage) {
  deleteTarget.value = message
  deleteError.value = null
  deleteDialog.value = true
}

function closeDeleteDialog() {
  deleteDialog.value = false
  deleteTarget.value = null
  deleteError.value = null
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = null
  try {
    await contactService.deleteMessage(deleteTarget.value.id)
    messages.value = messages.value.filter(m => m.id !== deleteTarget.value!.id)
    if (selectedMessage.value?.id === deleteTarget.value.id) {
      detailDialog.value = false
      selectedMessage.value = null
    }
    closeDeleteDialog()
  } catch {
    deleteError.value = 'Impossible de supprimer le message.'
  } finally {
    deleting.value = false
  }
}
</script>
