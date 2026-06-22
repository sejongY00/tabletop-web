<script setup lang="ts">
import { ref } from 'vue'
import { copyToClipboard } from '@/utils/clipboard'

const props = withDefaults(defineProps<{
  code: string
  compact?: boolean
}>(), {
  compact: false,
})

const status = ref<'idle' | 'copied' | 'failed'>('idle')

async function handleCopy() {
  if (!props.code) return
  const ok = await copyToClipboard(props.code)
  status.value = ok ? 'copied' : 'failed'
  setTimeout(() => { status.value = 'idle' }, 2000)
}
</script>

<template>
  <div class="room-code" :class="{ compact }">
    <div class="code-display">
      <span v-if="!compact" class="label">방 코드</span>
      <span class="code-text">{{ code }}</span>
    </div>
    <button
      type="button"
      class="copy-btn"
      :class="{ copied: status === 'copied', failed: status === 'failed' }"
      :disabled="!code"
      @click="handleCopy"
    >
      {{ status === 'copied' ? '복사됨!' : status === 'failed' ? '실패' : '복사' }}
    </button>
  </div>
</template>

<style scoped>
.room-code {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  user-select: none;
  -webkit-user-select: none;
}

.room-code.compact {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 300;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 10px;
  background: rgba(42, 42, 74, 0.85);
  border: 1px solid #444;
  border-radius: 8px;
}

.code-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.compact .code-display {
  flex-direction: row;
  gap: 6px;
}

.label {
  font-size: 0.85rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.code-text {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  color: #a29bfe;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.compact .code-text {
  font-size: 0.85rem;
  letter-spacing: 0.12em;
}

.copy-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #555;
  background: rgba(42, 42, 74, 0.9);
  color: #ccc;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  white-space: nowrap;
}

.compact .copy-btn {
  padding: 4px 10px;
  font-size: 0.75rem;
}

.copy-btn:active:not(:disabled) {
  background: #3d3560;
}

.copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.copy-btn.copied {
  border-color: #27ae60;
  color: #27ae60;
}

.copy-btn.failed {
  border-color: #e74c3c;
  color: #e74c3c;
}
</style>
