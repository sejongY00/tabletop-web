<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRoomStore } from '@/stores/roomStore'
import { usePeerRoom } from '@/composables/usePeerRoom'
import {
  generateRoomCode,
  generatePlayerId,
  saveSession,
  clearSession,
  loadSavedPlayerName,
  savePlayerName,
} from '@/utils/session'
import HomeButton from '@/components/HomeButton.vue'
import RoomCodeDisplay from '@/components/RoomCodeDisplay.vue'
import RoomJoinQr from '@/components/RoomJoinQr.vue'
import { parseRoomCodeFromQuery, ROOM_QUERY_KEY } from '@/utils/joinUrl'
import { MAX_PLAYERS } from '@/utils/boardLayout'
import type { RoomRole } from '@/games/onecard/types'

const router = useRouter()
const route = useRoute()
const store = useRoomStore()
const { hostRoom, joinRoom, destroy } = usePeerRoom()

const mode = ref<'menu' | 'join' | 'waiting'>('menu')
const inputCode = ref('')
const selectedRole = ref<RoomRole>('player')
const playerName = ref('')

onMounted(async () => {
  playerName.value = loadSavedPlayerName()
  await applyRoomFromQuery()
})

async function applyRoomFromQuery() {
  const code = parseRoomCodeFromQuery(route.query)
  if (!code) return

  if (route.query[ROOM_QUERY_KEY]) {
    router.replace({ path: route.path, query: {} })
  }

  inputCode.value = code
  mode.value = 'join'

  if (playerName.value.trim()) {
    await joinExistingRoom()
  }
}

watch(playerName, (name) => {
  savePlayerName(name)
})
const isConnecting = ref(false)
const localRoomCode = ref('')

const deviceCount = computed(() => 1 + store.playerCount)
const canStart = computed(() => store.canStartGame && deviceCount.value >= 3)

async function startCreateRoom() {
  const code = generateRoomCode()
  const pid = generatePlayerId()
  const role: RoomRole = 'board'

  store.reset()
  store.roomCode = code
  store.role = role
  store.playerId = pid
  store.playerName = '보드판'
  localRoomCode.value = code
  mode.value = 'waiting'

  saveSession({ roomCode: code, role, playerId: pid, playerName: store.playerName })
  isConnecting.value = true

  try {
    await hostRoom(code)
  } catch {
    store.connectionError = '방 생성에 실패했습니다. 다시 시도해주세요.'
    localRoomCode.value = ''
    mode.value = 'menu'
  } finally {
    isConnecting.value = false
  }
}

async function joinExistingRoom() {
  const code = inputCode.value.trim().toUpperCase()
  if (code.length !== 6) {
    store.connectionError = '6자리 방 코드를 입력해주세요.'
    return
  }

  const pid = generatePlayerId()
  const role = selectedRole.value

  if (role === 'board') {
    store.connectionError = '보드판은 방 만들기를 사용해주세요.'
    return
  }

  store.reset()
  store.roomCode = code
  store.role = role
  store.playerId = pid
  store.playerName = playerName.value.trim() || `플레이어 ${pid.slice(0, 4)}`
  savePlayerName(store.playerName)

  saveSession({ roomCode: code, role, playerId: pid, playerName: store.playerName })
  isConnecting.value = true

  try {
    await joinRoom(code, pid, store.playerName)
    navigateToGame()
  } catch {
    store.connectionError = store.connectionError || '방 접속에 실패했습니다. 보드판이 방을 연 상태인지 확인해주세요.'
  } finally {
    isConnecting.value = false
  }
}

function navigateToGame() {
  if (store.role === 'board') {
    router.push('/onecard/board')
  } else {
    router.push('/onecard/player')
  }
}

function goToBoard() {
  router.push('/onecard/board')
}

function leaveSubScreen() {
  if (mode.value === 'waiting') {
    destroy()
    clearSession()
    localRoomCode.value = ''
  }
  store.connectionError = ''
  mode.value = 'menu'
}
</script>

<template>
  <main class="lobby">
    <div class="top-actions">
      <HomeButton v-if="mode === 'menu'" />
    </div>

    <header class="lobby-header" :class="{ 'has-top-action': mode === 'menu' }">
      <button v-if="mode !== 'menu'" class="back" @click="leaveSubScreen">← 뒤로</button>
      <h1 class="title">원카드</h1>
    </header>

    <div class="lobby-body">
      <!-- 메인 메뉴 -->
      <div v-if="mode === 'menu'" class="menu">
        <button class="btn primary" @click="startCreateRoom">방 만들기</button>
        <button class="btn" @click="mode = 'join'">방 참가하기</button>
      </div>

      <!-- 방 참가 -->
      <div v-else-if="mode === 'join'" class="form">
        <label class="field">
          <span>방 코드</span>
          <input
            v-model="inputCode"
            placeholder="6자리 코드"
            maxlength="6"
            class="code-input"
            @input="inputCode = inputCode.toUpperCase()"
          />
        </label>

        <label class="field">
          <span>닉네임</span>
          <input v-model="playerName" placeholder="플레이어" maxlength="12" />
        </label>

        <fieldset class="role-select">
          <legend>역할 선택</legend>
          <label>
            <input v-model="selectedRole" type="radio" value="player" />
            플레이어
          </label>
        </fieldset>

        <button class="btn primary" :disabled="isConnecting" @click="joinExistingRoom">
          {{ isConnecting ? '연결 중...' : '접속하기' }}
        </button>
      </div>

      <!-- 대기 화면 (보드판) -->
      <div v-else-if="mode === 'waiting'" class="waiting">
        <RoomCodeDisplay :code="localRoomCode" />
        <RoomJoinQr :room-code="localRoomCode" />
        <p v-if="isConnecting" class="connecting">연결 중...</p>
        <p class="wait-info">
          접속: <strong>{{ deviceCount }}/{{ 1 + MAX_PLAYERS }}</strong>대
          · 플레이어 <strong>{{ store.playerCount }}/{{ MAX_PLAYERS }}</strong>명
        </p>
        <p class="wait-hint">플레이어 2~{{ MAX_PLAYERS }}명 접속 후 보드판에서 자리를 배치하고 게임을 시작하세요.</p>

        <ul v-if="store.players.length > 0" class="connected-list">
          <li v-for="p in store.players" :key="p.id">{{ p.name }}</li>
        </ul>
        <p v-else class="no-players">플레이어 대기 중...</p>

        <button
          class="btn primary"
          :disabled="!canStart"
          @click="goToBoard"
        >
          {{ canStart ? '보드판으로 이동' : `대기 중 (${deviceCount}/3)` }}
        </button>
      </div>

      <p v-if="store.connectionError" class="error">{{ store.connectionError }}</p>
    </div>
  </main>
</template>

<style scoped>
.lobby {
  height: 100vh;
  height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.lobby-header {
  flex-shrink: 0;
  padding: 24px 24px 0;
  padding-top: calc(24px + env(safe-area-inset-top, 0px));
}

.lobby-header.has-top-action {
  padding-right: 96px;
}

.top-actions {
  position: fixed;
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: calc(12px + env(safe-area-inset-right, 0px));
  z-index: 300;
}

.lobby-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 16px 24px 32px;
  padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px));
}

.back {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 12px;
  padding: 4px 0;
}

.title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  font-size: 0.85rem;
  color: #888;
}

.field input {
  padding: 12px 14px;
  border-radius: 8px;
  border: 2px solid #333;
  background: #2a2a4a;
  color: #eee;
  font-size: 1rem;
}

.code-input {
  font-size: 1.4rem !important;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-align: center;
}

.role-select {
  border: 2px solid #333;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  gap: 20px;
}

.role-select legend {
  font-size: 0.85rem;
  color: #888;
  padding: 0 6px;
}

.role-select label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.btn {
  padding: 14px;
  border-radius: 10px;
  border: 2px solid #444;
  background: #2a2a4a;
  color: #eee;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn.primary {
  background: #6c5ce7;
  border-color: #6c5ce7;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.wait-info {
  font-size: 1.1rem;
}

.connecting {
  font-size: 0.9rem;
  color: #888;
}

.wait-hint {
  font-size: 0.85rem;
  color: #888;
}

.connected-list {
  list-style: none;
  width: 100%;
}

.connected-list li {
  padding: 10px;
  background: #2a2a4a;
  border-radius: 8px;
  margin-bottom: 6px;
}

.no-players {
  color: #666;
  font-size: 0.9rem;
}

.error {
  margin-top: 20px;
  color: #e74c3c;
  font-size: 0.9rem;
  text-align: center;
}

@media (orientation: landscape) and (max-height: 520px) {
  .lobby-header {
    padding: 10px 20px 0;
    padding-top: calc(10px + env(safe-area-inset-top, 0px));
  }

  .lobby-header.has-top-action {
    padding-right: 88px;
  }

  .lobby-body {
    padding: 8px 20px 16px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }

  .title {
    font-size: 1.25rem;
  }

  .back {
    margin-bottom: 4px;
    font-size: 0.8rem;
  }

  .menu {
    gap: 10px;
  }

  .form {
    gap: 10px;
  }

  .field {
    gap: 4px;
  }

  .field span {
    font-size: 0.8rem;
  }

  .field input {
    padding: 8px 12px;
    font-size: 0.9rem;
  }

  .code-input {
    font-size: 1.1rem !important;
  }

  .role-select {
    padding: 8px 12px;
    gap: 12px;
  }

  .role-select legend {
    font-size: 0.8rem;
  }

  .btn {
    padding: 10px;
    font-size: 0.9rem;
  }

  .waiting {
    gap: 10px;
  }

  .wait-info {
    font-size: 0.95rem;
  }

  .wait-hint,
  .connecting,
  .no-players {
    font-size: 0.8rem;
  }

  .connected-list li {
    padding: 8px;
    font-size: 0.9rem;
  }

  .error {
    margin-top: 12px;
    font-size: 0.85rem;
  }

  .waiting :deep(.code-text) {
    font-size: 1.5rem;
  }

  .waiting :deep(.room-code) {
    gap: 8px;
  }

  .waiting :deep(.copy-btn) {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}
</style>
