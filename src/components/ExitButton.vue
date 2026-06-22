<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePeerRoom } from '@/composables/usePeerRoom'
import { clearSession } from '@/utils/session'

const router = useRouter()
const { destroy } = usePeerRoom()

function leave() {
  destroy()
  clearSession()
  router.push('/onecard/lobby')
}
</script>

<template>
  <button type="button" class="exit-btn" @click="leave">
    나가기
  </button>
</template>

<style scoped>
.exit-btn {
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

.exit-btn:active {
  background: #3d3560;
}
</style>
