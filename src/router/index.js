import { createRouter, createWebHistory } from "vue-router";
import { mainCard } from "../components/main-card";

const router = (baseAddress) => createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: `${baseAddress}`,
      name: "main",
      component: mainCard,
    },
  ],
})

export default router;
