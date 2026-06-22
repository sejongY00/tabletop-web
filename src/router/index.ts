import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/onecard/lobby',
      name: 'onecard-lobby',
      component: () => import('@/views/onecard/OneCardLobbyView.vue'),
    },
    {
      path: '/onecard/board',
      name: 'onecard-board',
      component: () => import('@/views/onecard/OneCardBoardView.vue'),
    },
    {
      path: '/onecard/player',
      name: 'onecard-player',
      component: () => import('@/views/onecard/OneCardPlayerView.vue'),
    },
  ],
})

export default router
