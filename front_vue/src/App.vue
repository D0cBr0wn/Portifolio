<template>
  <v-app :theme="theme">
    <router-view />
    <TechBadge />
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TechBadge from '@/components/TechBadge.vue'

const theme = ref('dark')
</script>
