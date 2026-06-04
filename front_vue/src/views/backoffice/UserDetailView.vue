<template>
  <AdminLayout>
    <div class="d-flex align-center gap-2 mb-6">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="router.push('/backoffice/users')">
        Retour
      </v-btn>
      <h1 class="text-h5">Gestion utilisateur</h1>
    </div>

    <v-alert v-if="store.error" type="error" class="mb-4" closable @click:close="store.error = null">
      {{ store.error }}
    </v-alert>

    <template v-if="store.loading && !store.currentUser">
      <v-skeleton-loader type="card" />
    </template>

    <template v-else-if="store.currentUser">
      <!-- Infos -->
      <v-card class="mb-4">
        <v-card-title class="text-subtitle-1">Informations</v-card-title>
        <v-card-text>
          <v-list density="compact">
            <v-list-item title="Email" :subtitle="store.currentUser.email" />
            <v-list-item title="Inscrit le" :subtitle="formatDate(store.currentUser.createdAt)" />
            <v-list-item title="Rôle">
              <template #subtitle>
                <v-chip :color="store.currentUser.role === 'ADMIN' ? 'primary' : 'default'" size="small" label>
                  {{ store.currentUser.role }}
                </v-chip>
              </template>
            </v-list-item>
            <v-list-item title="MFA">
              <template #subtitle>
                <v-icon :color="store.currentUser.mfaEnabled ? 'success' : 'default'" size="small">
                  {{ store.currentUser.mfaEnabled ? 'mdi-shield-check' : 'mdi-shield-off' }}
                </v-icon>
                {{ store.currentUser.mfaEnabled ? 'Activé' : 'Non configuré' }}
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <!-- Modifier le rôle -->
      <v-card class="mb-4">
        <v-card-title class="text-subtitle-1">Modifier le rôle</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedRole"
            :items="['USER', 'ADMIN']"
            label="Rôle"
            variant="outlined"
            density="compact"
            style="max-width: 200px"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            :loading="store.loading"
            :disabled="selectedRole === store.currentUser.role"
            @click="handleUpdateRole"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Modifier le mot de passe -->
      <v-card class="mb-4">
        <v-card-title class="text-subtitle-1">Modifier le mot de passe</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newPassword"
            label="Nouveau mot de passe"
            :type="showNewPassword ? 'text' : 'password'"
            variant="outlined"
            density="compact"
            style="max-width: 300px"
            :rules="[v => v.length >= 6 || 'Minimum 6 caractères']"
            :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showNewPassword = !showNewPassword"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            :loading="store.loading"
            :disabled="newPassword.length < 6"
            @click="handleUpdatePassword"
          >
            Modifier
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- MFA -->
      <v-card>
        <v-card-title class="text-subtitle-1">Authentification multi-facteurs</v-card-title>
        <v-card-text class="text-body-2 text-medium-emphasis">
          <template v-if="store.currentUser.mfaEnabled">
            Le MFA est actif. Désactiver forcera l'utilisateur à reconfigurer son authenticator s'il est remis en place.
          </template>
          <template v-else>
            Forcer le MFA : l'utilisateur devra configurer son authenticator à sa prochaine connexion.
          </template>
        </v-card-text>
        <v-card-actions>
          <v-btn
            v-if="!store.currentUser.mfaEnabled"
            color="warning"
            variant="outlined"
            :loading="store.loading"
            @click="handleRequireMfa"
          >
            Forcer le MFA
          </v-btn>
          <v-btn
            v-else
            color="error"
            variant="outlined"
            :loading="store.loading"
            @click="handleDisableMfa"
          >
            Désactiver le MFA
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const selectedRole = ref<'USER' | 'ADMIN'>('USER')
const newPassword = ref('')
const showNewPassword = ref(false)

onMounted(async () => {
  const id = parseInt(String(route.params.id), 10)
  await store.loadUser(id)
  if (store.currentUser) selectedRole.value = store.currentUser.role
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function handleUpdateRole() {
  if (!store.currentUser) return
  await store.updateRole(store.currentUser.id, selectedRole.value)
}

async function handleUpdatePassword() {
  if (!store.currentUser) return
  await store.updatePassword(store.currentUser.id, newPassword.value)
  if (!store.error) newPassword.value = ''
}

async function handleRequireMfa() {
  if (!store.currentUser) return
  await store.requireMfa(store.currentUser.id)
}

async function handleDisableMfa() {
  if (!store.currentUser) return
  await store.disableMfa(store.currentUser.id)
}
</script>
