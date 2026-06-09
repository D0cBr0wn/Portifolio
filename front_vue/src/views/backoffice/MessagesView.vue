<template>
  <AdminLayout>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5">Messages de contact</h1>
    </div>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

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
    </v-data-table>

    <v-dialog v-model="detailDialog" max-width="600">
      <v-card v-if="selectedMessage">
        <v-card-title>Message de {{ selectedMessage.name }}</v-card-title>
        <v-card-subtitle>{{ selectedMessage.email }} — {{ formatDate(selectedMessage.createdAt) }}</v-card-subtitle>
        <v-card-text class="pt-4" style="white-space: pre-wrap;">{{ selectedMessage.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">Fermer</v-btn>
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

const headers = [
  { title: 'Date', key: 'createdAt', sortable: true },
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Message', key: 'message', sortable: false },
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function truncate(text: string, max = 100) {
  return text.length > max ? text.slice(0, max) + '…' : text
}

function openDetail(message: ContactMessage) {
  selectedMessage.value = message
  detailDialog.value = true
}
</script>
