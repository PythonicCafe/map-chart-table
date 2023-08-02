import { createRouter, createWebHistory } from "vue-router";
import { mainCard } from "../components/main-card";

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "main",
      component: mainCard
    },
  ],
})
