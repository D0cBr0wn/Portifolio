// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_BACK_URL || "http://localhost:3000", // base de ton API Node.js
    },
  },
  css: [
    "vuetify/lib/styles/main.sass",
    "@/assets/main.scss",
    "@mdi/font/css/materialdesignicons.min.css",
  ],
  build: {
    transpile: ["vuetify"],
  },
  vite: {
    define: {
      "process.env.DEBUG": false,
    },
  },

  modules: ["@nuxt/test-utils", "@nuxt/icon", "@nuxt/eslint", "@pinia/nuxt"],
});
