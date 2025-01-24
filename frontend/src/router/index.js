import { createRouter, createWebHistory } from 'vue-router';
import GameIndex from '@/views/GameIndex.vue';
import GameLogin from '@/views/GameLogin.vue';
import { useAuthStore } from '@/stores/auth';

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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 守衛：未登入時導回主頁
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.login) {
    next('/');
  } else {
    next();
  }
});

export default router;
