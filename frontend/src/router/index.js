import { createRouter, createWebHistory } from 'vue-router';
import GameIndex from '@/views/GameIndex.vue';
import GameLogin from '@/views/GameLogin.vue';
import TestPage from '@/views/TestPage.vue';
import FakeDoor from '@/views/FakeDoor.vue';
import PvE from '@/views/PvE.vue';
import PvP from '@/views/PvPRooms.vue';
import { useGameStore } from '@/stores/game';
import { useContractStore } from '@/stores/contract';
import RoomWait from '@/views/RoomWait.vue';
import PvPGamePlay from '@/views/PvPGamePlay.vue';

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
    meta: { requiresAuth: true }
  },
  {
    path: '/pve',
    name: 'PvE',
    component: PvE,
    meta: { requiresAuth: true }
  },
  {
    path: '/pvp',
    name: 'PvP',
    component: PvP,
    meta: { requiresAuth: true }
  },
  {
    path: '/pvp/gameplay/:roomId',
    name: 'PvPGamePlay',
    component: PvPGamePlay,
    props: true, // 讓 roomId 傳遞到組件內
    meta: { requiresAuth: true }
  },
  {
    path: '/pvp/:roomId',
    name: 'RoomWait',
    component: RoomWait,
    props: true // 讓 roomId 傳遞到組件內
  },
  {
    path: '/testpage',
    name: 'TestPage',
    component: TestPage
  },
  {
    path: '/intro1',
    name: 'FakeDoor',
    component: FakeDoor
  },
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
