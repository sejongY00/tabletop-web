<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePeerRoom } from '@/composables/usePeerRoom'
import { clearSession } from '@/utils/session'

const router = useRouter()
const { destroy } = usePeerRoom()

function goHome() {
  destroy()
  clearSession()
  router.push('/')
}
</script>

<template>
  <button type="button" class="home-btn" @click="goHome">
    홈으로
  </button>
</template>

<style scoped>
.home-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #555;
  background: rgba(42, 42, 74, 0.9);
  color: #ccc;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}

.home-btn:active {
  background: #3d3560;
}
</style>
