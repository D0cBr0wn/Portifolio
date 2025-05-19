<template>
  <div>
    home
    <pre>{{ shows }}</pre>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
});

const config = useRuntimeConfig();
const shows = await $fetch(`${config.public.apiBase}/shows`);
</script>

<style scoped lang="scss"></style>

<style lang="scss"></style>
