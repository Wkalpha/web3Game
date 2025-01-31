import { createRouter, createWebHistory } from 'vue-router';
import GameIndex from '@/views/GameIndex.vue';
import GameLogin from '@/views/GameLogin.vue';
import TestPage from '@/views/TestPage.vue';
import PvE from '@/views/PvE.vue';
import { useGameStore } from '@/stores/game';
import { useContractStore } from '@/stores/contract';

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
  const contractStore = useContractStore();

  // 1. 若要在進入「登入頁」時重置 store
  if (to.name === 'GameLogin') {
    gameStore.$reset(); // Pinia 提供的重置方法
    contractStore.$reset();
  }

  if (to.meta.requiresAuth && !gameStore.login) {
    next('/');
  } else {
    next();
  }
});

export default router;
