<template>
  <v-app :theme="theme">
    <router-view />
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const theme = ref('dark')
</script>
