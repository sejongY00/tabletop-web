<script setup lang="ts">
import { ref, watch } from 'vue'
import QRCode from 'qrcode'
import { buildLobbyJoinUrl } from '@/utils/joinUrl'
import { copyToClipboard } from '@/utils/clipboard'

const props = defineProps<{
  roomCode: string
}>()

const dataUrl = ref('')
const joinUrl = ref('')
const copyStatus = ref<'idle' | 'copied' | 'failed'>('idle')

async function renderQr() {
  if (!props.roomCode) {
    dataUrl.value = ''
    joinUrl.value = ''
    return
  }

  joinUrl.value = buildLobbyJoinUrl(props.roomCode)
  dataUrl.value = await QRCode.toDataURL(joinUrl.value, {
    width: 220,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  })
}

watch(() => props.roomCode, renderQr, { immediate: true })

async function copyUrl() {
  if (!joinUrl.value) return
  const ok = await copyToClipboard(joinUrl.value)
  copyStatus.value = ok ? 'copied' : 'failed'
  setTimeout(() => { copyStatus.value = 'idle' }, 2000)
}
</script>

<template>
  <div v-if="roomCode" class="join-qr">
    <p class="label">QR로 참가</p>
    <img
      v-if="dataUrl"
      :src="dataUrl"
      alt="방 참가 QR 코드"
      class="qr-image"
      width="220"
      height="220"
    />
    <p class="url">{{ joinUrl }}</p>
    <button
      type="button"
      class="copy-btn"
      :class="{ copied: copyStatus === 'copied', failed: copyStatus === 'failed' }"
      @click="copyUrl"
    >
      {{ copyStatus === 'copied' ? '복사됨!' : copyStatus === 'failed' ? '실패' : 'URL 복사' }}
    </button>
  </div>
</template>

<style scoped>
.join-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  user-select: none;
  -webkit-user-select: none;
}

.label {
  font-size: 0.85rem;
  color: #888;
}

.qr-image {
  display: block;
  border-radius: 12px;
  background: #fff;
  padding: 8px;
}

.url {
  font-size: 0.75rem;
  color: #888;
  word-break: break-all;
  line-height: 1.4;
  max-width: 100%;
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
}

.copy-btn:active {
  background: #3d3560;
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
