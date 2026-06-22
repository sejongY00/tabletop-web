<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/roomStore'
import { usePeerRoom } from '@/composables/usePeerRoom'
import { loadSession } from '@/utils/session'
import type { CardColor } from '@/games/onecard/types'
import HandView from '@/components/HandView.vue'
import WildColorPicker from '@/components/WildColorPicker.vue'
import RoomCodeDisplay from '@/components/RoomCodeDisplay.vue'
import ExitButton from '@/components/ExitButton.vue'

const router = useRouter()
const store = useRoomStore()
const { joinRoom, sendPlayCard, sendDeclareOneCard, sendHandPreview } = usePeerRoom()

const isReady = ref(false)
const handRef = ref<InstanceType<typeof HandView> | null>(null)
const pendingWildCardId = ref<string | null>(null)
const showColorPicker = ref(false)

const isMyTurn = computed(() => store.currentTurnPlayerId === store.playerId)
const publicState = computed(() => store.publicState)
const drawPenalty = computed(() => publicState.value?.drawPenalty ?? 0)
const isPlaying = computed(() => publicState.value?.phase === 'playing')
const isRoundWon = computed(() => publicState.value?.phase === 'round_won')
const isFinished = computed(() => publicState.value?.phase === 'finished')

const turnLabel = computed(() => {
  if (isRoundWon.value) {
    if (publicState.value?.winnerId === store.playerId) return '패 완료!'
    return `${publicState.value?.winnerName ?? '누군가'} 패 완료`
  }
  if (isFinished.value) {
    if (publicState.value?.winnerId === store.playerId) return '승리!'
    return `${publicState.value?.winnerName ?? '누군가'} 승리`
  }
  if (!store.gameStarted) return '대기 중'
  if (isMyTurn.value) return '내 턴'
  return '상대 턴'
})

const isEliminated = computed(() => {
  if (!publicState.value || !store.gameStarted) return false
  return !publicState.value.turnOrder.includes(store.playerId)
})

onMounted(async () => {
  const session = loadSession()
  if (!session || session.role !== 'player') {
    router.replace('/onecard/lobby')
    return
  }

  store.roomCode = session.roomCode
  store.role = session.role
  store.playerId = session.playerId
  store.playerName = session.playerName || '플레이어'

  if (!store.isConnected) {
    try {
      await joinRoom(session.roomCode, session.playerId, store.playerName)
    } catch {
      router.replace('/onecard/lobby')
      return
    }
  }
  isReady.value = true
})

onUnmounted(() => {
  sendHandPreview(null)
})

function handleSelectionChange(cardId: string | null) {
  sendHandPreview(cardId)
}

function handlePlay(cardId: string) {
  sendPlayCard(cardId)
  handRef.value?.clearSelection()
}

function handleRequestColor(cardId: string) {
  pendingWildCardId.value = cardId
  showColorPicker.value = true
}

function handleColorSelect(color: CardColor) {
  if (pendingWildCardId.value) {
    sendPlayCard(pendingWildCardId.value, color)
    handRef.value?.clearSelection()
  }
  pendingWildCardId.value = null
  showColorPicker.value = false
}

function handleColorCancel() {
  pendingWildCardId.value = null
  showColorPicker.value = false
  handRef.value?.clearSelection()
}
</script>

<template>
  <main v-if="isReady" class="player">
    <RoomCodeDisplay :code="store.roomCode" compact />

    <div class="top-actions">
      <ExitButton />
    </div>

    <div class="turn-bar">
      <div class="turn-indicator" :class="{ active: isMyTurn && isPlaying }">
        {{ turnLabel }}
      </div>
    </div>

    <section v-if="isRoundWon" class="round-won">
      <p v-if="publicState?.winnerId === store.playerId">
        🎉 패를 모두 냈습니다!
      </p>
      <p v-else>
        🎉 {{ publicState?.winnerName }}님이 패를 모두 냈습니다
      </p>
      <p class="round-won-hint">보드판에서 이어하기 / 다시 하기를 선택해주세요</p>
    </section>

    <section v-else-if="store.gameStarted && isPlaying && !isEliminated" class="hand-area">
      <button
        v-if="store.myHand.length === 1"
        type="button"
        class="onecard-btn"
        @click="sendDeclareOneCard"
      >
        원카드!
      </button>
      <HandView
        ref="handRef"
        :cards="store.myHand"
        :top-card="publicState?.topCard ?? null"
        :active-color="publicState?.activeColor"
        :draw-penalty="drawPenalty"
        :can-interact="isMyTurn"
        @play="handlePlay"
        @request-color="handleRequestColor"
        @selection-change="handleSelectionChange"
      />
    </section>

    <section v-else-if="store.gameStarted && isPlaying && isEliminated" class="eliminated">
      <p>패를 모두 냈습니다</p>
      <p class="eliminated-hint">다른 플레이어 게임을 지켜보세요</p>
    </section>

    <section v-else-if="!store.gameStarted" class="waiting">
      <p>게임 시작 대기 중...</p>
    </section>

    <section v-else class="winner">
      <p>{{ publicState?.winnerId === store.playerId ? '🎉 승리!' : `🏆 ${publicState?.winnerName} 승리` }}</p>
      <p class="winner-hint">보드판에서 다시 하기를 눌러주세요</p>
    </section>

    <p v-if="store.statusMessage" class="toast">{{ store.statusMessage }}</p>

    <WildColorPicker
      :visible="showColorPicker"
      @select="handleColorSelect"
      @cancel="handleColorCancel"
    />
  </main>
</template>

<style scoped>
.player {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  position: relative;
  background: #1a1a2e;
  overflow: hidden;
}

.top-actions {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 300;
}

.turn-bar {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.turn-indicator {
  padding: 5px 16px;
  border-radius: 14px;
  background: rgba(42, 42, 74, 0.9);
  font-weight: 600;
  font-size: 0.85rem;
  color: #666;
}

.turn-indicator.active {
  background: #f1c40f;
  color: #1a1a2e;
}

.hand-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  max-height: 50vh;
  max-height: 50dvh;
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 5;
}

.winner {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #888;
}

.winner p {
  margin: 0;
}

.winner > p:first-child {
  font-size: 1.4rem;
  font-weight: 700;
  color: #f1c40f;
}

.winner-hint {
  font-size: 0.9rem;
  color: #666;
}

.round-won,
.eliminated {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
}

.round-won p,
.eliminated > p:first-child {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #f1c40f;
}

.round-won-hint,
.eliminated-hint {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  font-weight: 400;
}

.waiting {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

.onecard-btn {
  position: fixed;
  bottom: calc(min(50vh, 50dvh) + 8px);
  right: 12px;
  padding: 8px 16px;
  border-radius: 16px;
  border: none;
  background: #e74c3c;
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  z-index: 20;
  animation: blink 1s ease infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
}

.toast {
  position: fixed;
  bottom: calc(min(50vh, 50dvh) + min(24vh, 24dvh) + 12px);
  left: 50%;
  transform: translateX(-50%);
  background: #2a2a4a;
  border: 2px solid #e74c3c;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 0.85rem;
  z-index: 300;
  white-space: nowrap;
}
</style>
