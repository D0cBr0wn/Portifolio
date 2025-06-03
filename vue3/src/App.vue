<template>
  <RouterView v-slot="{ Component }">
    <component :is="layout">
      <component :is="Component" />
    </component>
  </RouterView>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import DefaultLayout from "./layouts/Default.vue";
import AdminLayout from "./layouts/Admin.vue";
import LoginLayout from "./layouts/Login.vue";

const route = useRoute();

// Sélection du layout selon la meta
const layout = computed(() => {
  const layoutName = route.meta.layout || "default";

  if (layoutName === "admin") {
    return AdminLayout;
  }

  if (layoutName === "login") {
    return LoginLayout;
  }

  return DefaultLayout;
});
</script>
