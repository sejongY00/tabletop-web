import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Card, PublicGameState, RoomRole } from '@/games/onecard/types'
import type { ConnectedPlayer } from '@/composables/messages'

export const useRoomStore = defineStore('room', () => {
  const roomCode = ref('')
  const role = ref<RoomRole | null>(null)
  const playerId = ref('')
  const playerName = ref('')
  const isConnected = ref(false)
  const connectionError = ref('')
  const players = ref<{ id: string; name: string }[]>([])
  const connectedPlayers = ref<ConnectedPlayer[]>([])
  const gameStarted = ref(false)
  const publicState = ref<PublicGameState | null>(null)
  const myHand = ref<Card[]>([])
  const playerHandPreviews = ref<Record<string, string | null>>({})
  const statusMessage = ref('')

  const isBoard = computed(() => role.value === 'board')
  const isPlayer = computed(() => role.value === 'player')
  const playerCount = computed(() => players.value.length)
  const canStartGame = computed(() => isBoard.value && playerCount.value >= 2 && !gameStarted.value)
  const totalDevices = computed(() => (isBoard.value ? 1 + playerCount.value : 0))
  const currentTurnPlayerId = computed(() => {
    if (!publicState.value) return null
    return publicState.value.turnOrder[publicState.value.currentTurnIndex] ?? null
  })

  function reset() {
    roomCode.value = ''
    role.value = null
    playerId.value = ''
    playerName.value = ''
    isConnected.value = false
    connectionError.value = ''
    players.value = []
    connectedPlayers.value = []
    gameStarted.value = false
    publicState.value = null
    myHand.value = []
    playerHandPreviews.value = {}
    statusMessage.value = ''
  }

  function setPlayerHandPreview(playerId: string, cardId: string | null) {
    playerHandPreviews.value = { ...playerHandPreviews.value, [playerId]: cardId }
  }

  function clearPlayerHandPreview(playerId: string) {
    const next = { ...playerHandPreviews.value }
    delete next[playerId]
    playerHandPreviews.value = next
  }

  function setStatus(msg: string) {
    statusMessage.value = msg
    setTimeout(() => {
      if (statusMessage.value === msg) statusMessage.value = ''
    }, 3000)
  }

  return {
    roomCode,
    role,
    playerId,
    playerName,
    isConnected,
    connectionError,
    players,
    connectedPlayers,
    gameStarted,
    publicState,
    myHand,
    playerHandPreviews,
    statusMessage,
    isBoard,
    isPlayer,
    playerCount,
    canStartGame,
    totalDevices,
    currentTurnPlayerId,
    reset,
    setPlayerHandPreview,
    clearPlayerHandPreview,
    setStatus,
  }
})
