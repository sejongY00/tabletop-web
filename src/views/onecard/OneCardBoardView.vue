<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/roomStore'
import { usePeerRoom } from '@/composables/usePeerRoom'
import { loadSession } from '@/utils/session'
import { canUndo } from '@/games/onecard/game'
import {
  CORNERS_CLOCKWISE,
  autoAssignSeats,
  assignedPlayerCount,
  emptySeats,
  loadSeats,
  saveSeats,
  type BoardCorner,
  type SeatMap,
  MAX_PLAYERS,
} from '@/utils/boardLayout'
import RoomCodeDisplay from '@/components/RoomCodeDisplay.vue'
import BoardSeatPicker from '@/components/BoardSeatPicker.vue'
import BoardCornerZone from '@/components/BoardCornerZone.vue'
import DeckView from '@/components/DeckView.vue'
import DiscardPileView from '@/components/DiscardPileView.vue'
import UndoTurnButton from '@/components/UndoTurnButton.vue'
import ExitButton from '@/components/ExitButton.vue'

const router = useRouter()
const store = useRoomStore()
const { hostRoom, startGame, restartGame, continueGame, drawForPlayer, undo, destroy, gameState } = usePeerRoom()

const isReady = ref(false)
const seatMap = ref<SeatMap>(emptySeats())

const publicState = computed(() => store.publicState)
const players = computed(() => {
  if (gameState.value) return gameState.value.players
  return store.players.map((p) => ({ ...p, handCount: 0 }))
})

const currentTurnId = computed(() => store.currentTurnPlayerId)
const undoDisabled = computed(() => !gameState.value || !canUndo(gameState.value))
const isPlaying = computed(() => publicState.value?.phase === 'playing')
const isRoundWon = computed(() => publicState.value?.phase === 'round_won')
const isFinished = computed(() => publicState.value?.phase === 'finished')
const deckCount = computed(() => publicState.value?.deckCount ?? null)

const canStart = computed(
  () => store.canStartGame && assignedPlayerCount(seatMap.value) >= 2,
)

function syncSeatsFromPlayers() {
  if (store.gameStarted) return
  const ids = store.players.map((p) => p.id)
  seatMap.value = autoAssignSeats(ids, seatMap.value)
  saveSeats(seatMap.value)
}

function updateSeats(next: SeatMap) {
  seatMap.value = next
  saveSeats(next)
}

function playerAtCorner(corner: BoardCorner) {
  const id = seatMap.value[corner]
  if (!id) return null
  return players.value.find((p) => p.id === id) ?? null
}

function getPlayerPreviewIndex(playerId: string): number | null {
  const cardId = store.playerHandPreviews[playerId]
  if (!cardId || !gameState.value) return null
  const hand = gameState.value.hands[playerId] ?? []
  const idx = hand.findIndex((c) => c.id === cardId)
  return idx >= 0 && idx < 14 ? idx : null
}

function previewForCorner(corner: BoardCorner) {
  const player = playerAtCorner(corner)
  return player ? getPlayerPreviewIndex(player.id) : null
}

watch(
  () => store.players.map((p) => p.id).join(','),
  syncSeatsFromPlayers,
)

onMounted(async () => {
  const session = loadSession()
  if (!session || session.role !== 'board') {
    router.replace('/onecard/lobby')
    return
  }

  store.roomCode = session.roomCode
  store.role = session.role
  store.playerId = session.playerId

  seatMap.value = loadSeats() ?? emptySeats()

  if (!store.isConnected) {
    try {
      await hostRoom(session.roomCode)
    } catch {
      router.replace('/onecard/lobby')
      return
    }
  }

  syncSeatsFromPlayers()
  isReady.value = true
})

onUnmounted(() => {
  destroy()
})

function handleStartGame() {
  saveSeats(seatMap.value)
  startGame(seatMap.value)
}

function handleDraw(playerId: string) {
  if (!isPlaying.value) return
  if (!store.gameStarted) {
    store.setStatus('게임을 먼저 시작해주세요.')
    return
  }
  const err = drawForPlayer(playerId)
  if (err) store.setStatus(err)
}

function handleRestart() {
  restartGame(seatMap.value)
}

function handleContinue() {
  continueGame()
}
</script>

<template>
  <main v-if="isReady" class="board">
    <RoomCodeDisplay :code="store.roomCode" compact />

    <div class="top-actions">
      <ExitButton />
    </div>

    <section v-if="!store.gameStarted" class="pre-game">
      <p class="device-count">
        접속: {{ 1 + store.playerCount }}대 · 플레이어 {{ store.playerCount }}/{{ MAX_PLAYERS }}명
      </p>
      <BoardSeatPicker
        :seats="seatMap"
        :players="store.players"
        @update:seats="updateSeats"
      />
      <button
        class="start-btn"
        :disabled="!canStart"
        @click="handleStartGame"
      >
        {{ canStart ? '게임 시작' : '플레이어 2명 이상 배치 필요' }}
      </button>
    </section>

    <section v-else class="game-table">
      <div v-if="isRoundWon" class="winner-banner round-won">
        <p class="winner-text">🎉 {{ publicState?.winnerName }}님이 패를 모두 냈습니다!</p>
        <p class="winner-sub">이어서 진행할까요, 새 게임을 시작할까요?</p>
        <div class="winner-actions">
          <button type="button" class="continue-btn" @click="handleContinue">
            이어하기
          </button>
          <button type="button" class="restart-btn" @click="handleRestart">
            다시 하기
          </button>
        </div>
      </div>

      <div v-else-if="isFinished" class="winner-banner">
        <p class="winner-text">🏆 {{ publicState?.winnerName }} 승리!</p>
        <button type="button" class="restart-btn" @click="handleRestart">
          다시 하기
        </button>
      </div>

      <template v-for="corner in CORNERS_CLOCKWISE" :key="corner">
        <BoardCornerZone
          v-if="playerAtCorner(corner)"
          :corner="corner"
          :player-name="playerAtCorner(corner)!.name"
          :hand-count="playerAtCorner(corner)!.handCount"
          :is-turn="currentTurnId === playerAtCorner(corner)!.id"
          :preview-index="previewForCorner(corner)"
          :show-draw="isPlaying"
          @draw="handleDraw(playerAtCorner(corner)!.id)"
        />
      </template>

      <div class="center-pile">
        <DeckView large :count="deckCount" />
        <DiscardPileView
          :top-card="publicState?.topCard ?? null"
          :active-color="publicState?.activeColor"
          large
        />
      </div>
    </section>

    <p v-if="store.statusMessage" class="toast">{{ store.statusMessage }}</p>
    <UndoTurnButton
      v-if="store.gameStarted && (isPlaying || isRoundWon)"
      :disabled="undoDisabled"
      @undo="undo()"
    />
  </main>
</template>

<style scoped>
.board {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at center, #1e2a4a 0%, #1a1a2e 70%);
  overflow: hidden;
}

.pre-game {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 56px 16px 24px;
}

.device-count {
  color: #888;
  font-size: 0.9rem;
}

.start-btn {
  padding: 16px 32px;
  border-radius: 12px;
  border: none;
  background: #6c5ce7;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
}

.start-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.game-table {
  flex: 1;
  display: grid;
  grid-template-areas:
    ". top ."
    "left center right"
    ". bottom .";
  grid-template-columns: minmax(72px, 1fr) auto minmax(72px, 1fr);
  grid-template-rows: auto 1fr auto;
  align-items: center;
  justify-items: center;
  padding: 48px 8px 16px;
  min-height: 100vh;
  min-height: 100dvh;
  gap: 4px;
}

.center-pile {
  grid-area: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(24px, 6vw, 64px);
  padding: 8px 0;
}

.winner-banner {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 32px;
  background: rgba(26, 26, 46, 0.92);
  border-radius: 16px;
  border: 2px solid #f1c40f;
  z-index: 200;
}

.winner-text {
  font-size: 1.6rem;
  font-weight: 700;
  color: #f1c40f;
  margin: 0;
}

.winner-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #aaa;
  text-align: center;
}

.winner-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.continue-btn {
  padding: 12px 28px;
  border-radius: 12px;
  border: none;
  background: #27ae60;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.continue-btn:active {
  transform: scale(0.97);
}

.restart-btn {
  padding: 12px 28px;
  border-radius: 12px;
  border: none;
  background: #6c5ce7;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.restart-btn:active {
  transform: scale(0.97);
}

.top-actions {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 300;
}

.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #2a2a4a;
  border: 2px solid #6c5ce7;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  z-index: 200;
  white-space: nowrap;
}
</style>
