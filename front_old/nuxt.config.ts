// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_BACK_URL || "http://localhost:3000/api", // base de ton API Node.js
    },
  },
  css: ["vuetify/lib/styles/main.sass", "@/assets/main.scss"],
  build: {
    transpile: ["vuetify"],
  },
  devServer: {
    host: "0.0.0.0",
    port: 3001,
  },
  vite: {
    define: {
      "process.env.DEBUG": false,
    },
  },

  modules: ["@nuxt/test-utils", "@nuxt/icon", "@nuxt/eslint", "@pinia/nuxt"],
});
