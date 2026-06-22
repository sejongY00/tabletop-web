<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  undo: []
}>()
</script>

<template>
  <button
    class="undo-btn"
    :disabled="disabled"
    @click="emit('undo')"
  >
    ↩ 되돌리기
  </button>
</template>

<style scoped>
.undo-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 18px;
  border-radius: 10px;
  border: 2px solid #555;
  background: #2a2a4a;
  color: #eee;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  z-index: 100;
  transition: opacity 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.undo-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.undo-btn:not(:disabled):active {
  background: #3d3560;
}
</style>
