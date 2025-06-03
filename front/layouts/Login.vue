<template>
  <div class="main-container">
    <div class="header-wrapper">
      <v-snackbar
        v-for="notif in notificationStore.list"
        :key="notif.id"
        v-model="notif.visible"
        :color="notif.type"
        :timeout="notif.timeout"
        location="top right"
        @click:close="notificationStore.remove(notif.id)"
      >
        {{ notif.message }}
      </v-snackbar>

      <div class="header">
        <div class="logo"></div>
      </div>

      <!-- <links /> -->
    </div>

    <div class="content">
      <slot />
    </div>
    <!-- <footer-module /> -->
  </div>
</template>

<script setup>
// import FooterModule from '@/components/FooterModule.vue'
import { useNotificationStore } from "../pinia/notificationsStore";

const notificationStore = useNotificationStore();
</script>

<style scoped>
.main-container {
  background: #ffffff;
  color: #000000;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
}

.header {
  width: 100%;
  height: 300px;
  background: url("@/assets/bg.jpg") no-repeat center center;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo {
  width: 400px;
  height: 200px;
  background: url("@/assets/logo.png") no-repeat center center;
  background-size: contain;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 2rem;
  height: 100%;
}
</style>
