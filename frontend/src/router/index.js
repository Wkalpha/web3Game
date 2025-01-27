import { createRouter, createWebHistory } from 'vue-router';
import GameIndex from '@/views/GameIndex.vue';
import GameLogin from '@/views/GameLogin.vue';
import TestPage from '@/views/TestPage.vue';
import PvE from '@/views/PvE.vue';
import { useGameStore } from '@/stores/game';

const routes = [
  {
    path: '/',
    name: 'GameLogin',
    component: GameLogin
  },
  {
    path: '/index',
    name: 'GameIndex',
    component: GameIndex,
    meta: { requiresAuth: true }  // 需要登入
  },
  {
    path: '/pve',
    name: 'PvE',
    component: PvE,
    meta: { requiresAuth: true }  // 需要登入
  },
  {
    path: '/testpage',
    name: 'TestPage',
    component: TestPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 守衛：未登入時導回主頁
router.beforeEach((to, from, next) => {
  const gameStore = useGameStore();
  if (to.meta.requiresAuth && !gameStore.login) {
    next('/');
  } else {
    next();
  }
});

export default router;
