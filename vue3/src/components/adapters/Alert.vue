<template>
  <div class="alert">
    <v-alert
      v-if="msg"
      :title="title"
      :text="msg"
      :type="type"
      variant="tonal"
    ></v-alert>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  title: { type: String, default: "An error has occured" },
  msg: { type: String, default: undefined },
  type: {
    type: String as PropType<"error" | "success" | "info" | "warning">,
    default: "error",
  },
});
</script>

<style lang="scss" scoped>
.alert {
  margin-bottom: 2rem;
}
</style>
