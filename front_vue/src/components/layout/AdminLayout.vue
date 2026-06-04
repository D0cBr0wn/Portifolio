<template>
  <v-app theme="light">
    <v-app-bar color="primary" flat>
      <v-app-bar-title>Portfolio — Backoffice</v-app-bar-title>
      <template #append>
        <v-btn variant="text" @click="handleLogout">Déconnexion</v-btn>
      </template>
    </v-app-bar>
    <v-navigation-drawer permanent>
      <v-list nav>
        <v-list-item
          title="Lieux"
          prepend-icon="mdi-map-marker"
          to="/backoffice/venues"
        />
        <v-list-item
          title="Concerts"
          prepend-icon="mdi-music"
          to="/backoffice/shows"
        />
        <v-list-item
          title="Sécurité MFA"
          prepend-icon="mdi-shield-key"
          to="/backoffice/mfa-setup"
        />
        <v-list-item
          v-if="auth.isAdmin"
          title="Utilisateurs"
          prepend-icon="mdi-account-multiple"
          to="/backoffice/users"
        />
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
