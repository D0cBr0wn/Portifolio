import { createRouter, createWebHistory } from "vue-router";

// Importe tes vues (pages)
import Home from "../pages/Home.vue";
import Login from "../pages/auboulot/index.vue";
// import NotFoundPage from '../pages/NotFoundPage.vue'

const routes = [
  {
    path: "/",
    component: Home,
    meta: { layout: "default" },
  },
  {
    path: "/auboulot",
    component: Login,
    meta: { layout: "login" }, // Layout admin
  },
  //   {
  //     path: "/:pathMatch(.*)*",
  //     component: NotFoundPage,
  //     meta: { layout: "default" }, // Layout par défaut pour 404
  //   },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
