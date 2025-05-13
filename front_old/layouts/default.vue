<template>
  <div class="main-container">
    <div class="header-wrapper">
      <div class="header">
        <div class="logo"></div>
      </div>
      <!-- <links /> -->
    </div>
    <div class="content">
      <slot />
    </div>
    <footer-module />
  </div>
</template>

<script setup>
// import FooterModule from '@/components/FooterModule.vue'
</script>

<style scoped>
.main-container {
  background: #1a1a1a;
  color: #ffffff;
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
