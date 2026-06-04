<template>
  <AdminLayout>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5">Utilisateurs</h1>
    </div>

    <v-alert v-if="store.error" type="error" class="mb-4">{{ store.error }}</v-alert>

    <v-data-table
      :headers="headers"
      :items="store.users"
      :loading="store.loading"
      loading-text="Chargement des utilisateurs..."
      no-data-text="Aucun utilisateur enregistré."
      item-value="id"
      hover
      @click:row="(_: unknown, { item }: { item: UserData }) => router.push(`/backoffice/users/${item.id}`)"
    >
      <template #item.role="{ item }">
        <v-chip :color="item.role === 'ADMIN' ? 'primary' : 'default'" size="small" label>
          {{ item.role }}
        </v-chip>
      </template>
      <template #item.mfaEnabled="{ item }">
        <v-icon :color="item.mfaEnabled ? 'success' : 'default'">
          {{ item.mfaEnabled ? 'mdi-shield-check' : 'mdi-shield-off' }}
        </v-icon>
      </template>
      <template #item.createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          icon
          size="small"
          variant="text"
          color="error"
          :disabled="item.role === 'ADMIN'"
          @click.stop="openDelete(item)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- Dialog suppression -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>Confirmer la suppression</v-card-title>
        <v-card-text>
          Supprimer l'utilisateur <strong>{{ deleteTarget?.email }}</strong> ?
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
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { useUserStore } from '@/stores/userStore'
import type { UserData } from '@portfolio/shared'

const router = useRouter()

const store = useUserStore()
const deleteDialog = ref(false)
const deleteTarget = ref<UserData | null>(null)

const headers = [
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Rôle', key: 'role', sortable: true },
  { title: 'MFA', key: 'mfaEnabled', sortable: false },
  { title: 'Inscrit le', key: 'createdAt', sortable: true },
  { title: '', key: 'actions', sortable: false },
]

onMounted(() => store.load())

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function openDelete(user: UserData) {
  deleteTarget.value = user
  deleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  await store.remove(deleteTarget.value.id)
  if (!store.error) deleteDialog.value = false
}
</script>
