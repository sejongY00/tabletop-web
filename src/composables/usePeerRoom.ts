import { ref } from 'vue'
import Peer, { type DataConnection } from 'peerjs'
import type { CardColor, GameState } from '@/games/onecard/types'
import { createGame, drawCardToPlayer, playCard, playerDrawCards, declareOneCard, toPublicState, undoLastAction, continueAfterRoundWin, getTopCard } from '@/games/onecard/game'
import { createPeerOptions } from '@/config/peer'
import {
  autoAssignSeats,
  loadSeats,
  turnOrderFromSeats,
  cornerForPlayer,
  MAX_PLAYERS,
  type SeatMap,
} from '@/utils/boardLayout'
import { useRoomStore } from '@/stores/roomStore'
import type { ConnectedPlayer, PeerConnection, RoomMessage } from './messages'

const CONNECTION_TIMEOUT_MS = 25_000

const peer = ref<Peer | null>(null)
const gameState = ref<GameState | null>(null)

let pendingJoinResolve: (() => void) | null = null
let pendingJoinReject: ((err: Error) => void) | null = null
let connectionTimeout: ReturnType<typeof setTimeout> | null = null

function clearJoinPending() {
  if (connectionTimeout) {
    clearTimeout(connectionTimeout)
    connectionTimeout = null
  }
  pendingJoinResolve = null
  pendingJoinReject = null
}

function send(conn: PeerConnection, msg: RoomMessage) {
  if (conn.open) {
    conn.send(msg)
  }
}

function broadcast(msg: RoomMessage, excludeId?: string) {
  const store = useRoomStore()
  for (const p of store.connectedPlayers) {
    if (p.id !== excludeId) {
      send(p.connection, msg)
    }
  }
}

function syncAllHands() {
  const store = useRoomStore()
  if (!gameState.value) return
  for (const p of store.connectedPlayers) {
    const hand = gameState.value.hands[p.id] ?? []
    send(p.connection, { type: 'hand-update', hand })
  }
  store.publicState = toPublicState(gameState.value)
  broadcast({ type: 'state-update', state: store.publicState })
}

function resolveJoin() {
  const resolve = pendingJoinResolve
  if (!resolve) return
  clearJoinPending()
  resolve()
}

function rejectJoin(message: string) {
  const reject = pendingJoinReject
  if (!reject) return
  clearJoinPending()
  reject(new Error(message))
}

function handleClientMessage(msg: RoomMessage, conn: PeerConnection) {
  const store = useRoomStore()
  switch (msg.type) {
    case 'joined':
      store.players = msg.players
      store.connectedPlayers = [{
        id: 'board',
        name: '보드판',
        connection: conn,
      }]
      resolveJoin()
      break
    case 'players-update':
      store.players = msg.players
      break
    case 'reject':
      store.connectionError = msg.reason
      rejectJoin(msg.reason)
      break
    case 'player-left':
      store.players = msg.players
      break
    case 'game-start':
      store.gameStarted = true
      break
    case 'hand-update':
      store.myHand = msg.hand
      break
    case 'state-update':
      store.publicState = msg.state
      break
    case 'play-rejected':
      store.setStatus(msg.reason)
      break
  }
}

function handleHostPlayerMessage(msg: RoomMessage, conn: PeerConnection) {
  if (msg.type === 'hand-preview') {
    useRoomStore().setPlayerHandPreview(msg.playerId, msg.cardId)
    return
  }

  if (!gameState.value) return

  switch (msg.type) {
    case 'play-card': {
      const prevTop = getTopCard(gameState.value)
      const prevActiveColor = gameState.value.activeColor
      const result = playCard(gameState.value, msg.playerId, msg.cardId, msg.chosenColor)
      if (!result.ok) {
        send(conn, { type: 'play-rejected', reason: result.reason })
        return
      }
      const playedCard = result.state.discardPile[result.state.discardPile.length - 1]
      gameState.value = result.state
      const store = useRoomStore()
      store.clearPlayerHandPreview(msg.playerId)
      const seats = loadSeats()
      const corner = seats ? cornerForPlayer(seats, msg.playerId) : null
      if (playedCard && corner) {
        store.triggerPlayAnimation(
          msg.playerId,
          corner,
          playedCard,
          result.state.activeColor,
          prevTop,
          prevActiveColor,
        )
      }
      syncAllHands()
      break
    }
    case 'request-draw': {
      const result = playerDrawCards(gameState.value, msg.playerId)
      if (!result.ok) {
        send(conn, { type: 'play-rejected', reason: result.reason })
        return
      }
      gameState.value = result.state
      syncAllHands()
      break
    }
    case 'declare-onecard': {
      gameState.value = declareOneCard(gameState.value, msg.playerId)
      const store = useRoomStore()
      store.publicState = toPublicState(gameState.value)
      broadcast({ type: 'state-update', state: store.publicState })
      break
    }
  }
}

function setupConnectionHandler(conn: DataConnection) {
  const peerConn = conn as unknown as PeerConnection

  conn.on('open', () => {
    const store = useRoomStore()

    conn.on('data', (data) => {
      const msg = data as RoomMessage
      if (msg.type === 'join' && msg.role === 'player') {
        const existing = store.connectedPlayers.find((cp) => cp.id === msg.playerId)
        if (existing) return

        if (store.connectedPlayers.length >= MAX_PLAYERS) {
          send(peerConn, { type: 'reject', reason: '방이 가득 찼습니다 (최대 4명)' })
          return
        }

        const newPlayer: ConnectedPlayer = {
          id: msg.playerId,
          name: msg.name,
          connection: peerConn,
        }
        store.connectedPlayers.push(newPlayer)
        store.players = store.connectedPlayers.map((cp) => ({
          id: cp.id,
          name: cp.name,
        }))

        send(peerConn, {
          type: 'joined',
          playerId: msg.playerId,
          players: store.players,
        })
        broadcast(
          { type: 'players-update', players: store.players },
          msg.playerId,
        )
      } else if (
        msg.type === 'play-card'
        || msg.type === 'request-draw'
        || msg.type === 'declare-onecard'
        || msg.type === 'hand-preview'
      ) {
        handleHostPlayerMessage(msg, peerConn)
      }
    })

    conn.on('close', () => {
      const store = useRoomStore()
      const left = store.connectedPlayers.find((cp) => cp.connection === peerConn)
      if (!left) return
      store.connectedPlayers = store.connectedPlayers.filter((cp) => cp.id !== left.id)
      store.players = store.connectedPlayers.map((cp) => ({
        id: cp.id,
        name: cp.name,
      }))
      store.clearPlayerHandPreview(left.id)
      broadcast({ type: 'player-left', playerId: left.id, players: store.players })
      if (gameState.value) {
        gameState.value.phase = 'paused'
        syncAllHands()
      }
    })

    conn.on('error', () => {
      rejectJoin('WebRTC 연결에 실패했습니다. 네트워크를 확인해주세요.')
    })
  })
}

function waitForPeerOpen(p: Peer): Promise<void> {
  return new Promise((resolve, reject) => {
    if (p.open) {
      resolve()
      return
    }
    p.once('open', () => resolve())
    p.once('error', (err) => reject(err))
  })
}

async function hostRoom(roomCode: string): Promise<void> {
  const store = useRoomStore()
  if (peer.value && !peer.value.destroyed) {
    store.isConnected = true
    return
  }

  const p = new Peer(roomCode, createPeerOptions())
  peer.value = p
  p.on('connection', setupConnectionHandler)

  try {
    await waitForPeerOpen(p)
    store.isConnected = true
  } catch (err) {
    const message = err instanceof Error ? err.message : '방 생성에 실패했습니다.'
    if (message.includes('is taken') || message.includes('ID')) {
      store.connectionError = '방 코드가 이미 사용 중입니다. 다시 시도해주세요.'
    } else {
      store.connectionError = message
    }
    p.destroy()
    peer.value = null
    throw err
  }
}

async function joinRoom(roomCode: string, pid: string, name: string): Promise<void> {
  const store = useRoomStore()
  if (peer.value && store.isConnected && store.players.length > 0) return

  return new Promise((resolve, reject) => {
    pendingJoinResolve = resolve
    pendingJoinReject = reject

    connectionTimeout = setTimeout(() => {
      store.connectionError = '연결 시간이 초과되었습니다. 보드판이 방을 열었는지 확인해주세요.'
      rejectJoin('연결 시간이 초과되었습니다.')
    }, CONNECTION_TIMEOUT_MS)

    const p = new Peer(createPeerOptions())
    peer.value = p

    p.on('error', (err) => {
      const msg = err.message
      if (msg.includes('Could not connect') || msg.includes('Lost connection')) {
        store.connectionError = '보드판을 찾을 수 없습니다. 방 코드를 확인해주세요.'
      } else {
        store.connectionError = msg
      }
      rejectJoin(msg)
    })

    p.on('open', () => {
      const conn = p.connect(roomCode, { reliable: true })
      const peerConn = conn as unknown as PeerConnection

      conn.on('open', () => {
        store.isConnected = true
        send(peerConn, { type: 'join', role: 'player', playerId: pid, name })
      })

      conn.on('data', (data) => {
        handleClientMessage(data as RoomMessage, peerConn)
      })

      conn.on('close', () => {
        store.isConnected = false
        store.connectionError = '보드판과의 연결이 끊어졌습니다.'
      })

      conn.on('error', () => {
        store.connectionError = 'WebRTC 연결에 실패했습니다. 같은 Wi-Fi에 연결되어 있는지 확인해주세요.'
        rejectJoin('WebRTC ICE 연결 실패')
      })
    })
  })
}

function startGame(seats?: SeatMap) {
  const store = useRoomStore()
  if (!store.canStartGame) return
  beginGame(seats)
}

function restartGame(seats?: SeatMap) {
  const store = useRoomStore()
  if (!store.isBoard || store.playerCount < 2) return
  beginGame(seats)
}

function continueGame() {
  if (!gameState.value) return
  gameState.value = continueAfterRoundWin(gameState.value)
  syncAllHands()
}

function beginGame(seats?: SeatMap) {
  const store = useRoomStore()

  const playerIds = store.connectedPlayers.map((p) => p.id)
  const seatMap = seats ?? loadSeats() ?? autoAssignSeats(playerIds)
  const orderedIds = turnOrderFromSeats(seatMap)

  if (orderedIds.length < 2) return

  const playerNames: Record<string, string> = {}
  for (const p of store.connectedPlayers) {
    playerNames[p.id] = p.name
  }

  gameState.value = createGame(orderedIds, playerNames)
  store.gameStarted = true
  store.playerHandPreviews = {}

  broadcast({ type: 'game-start', turnOrder: gameState.value.turnOrder })
  syncAllHands()
}

function drawToPlayer(targetPlayerId: string) {
  if (!gameState.value) return
  gameState.value = drawCardToPlayer(gameState.value, targetPlayerId)
  syncAllHands()
}

function drawForPlayer(playerId: string): string | null {
  if (!gameState.value) return '게임이 시작되지 않았습니다.'
  if (gameState.value.phase !== 'playing') return '지금은 카드를 뽑을 수 없습니다.'
  if (!gameState.value.turnOrder.includes(playerId)) return '이미 패를 모두 낸 플레이어입니다.'

  const state = gameState.value
  const currentId = state.turnOrder[state.currentTurnIndex]
  const store = useRoomStore()

  if (state.drawPenalty > 0 && currentId !== playerId) {
    return '공격 카드를 받을 차례인 플레이어부터 뽑아주세요.'
  }

  let drawCount = 1

  if (currentId === playerId) {
    drawCount = state.drawPenalty > 0 ? state.drawPenalty : 1
    const result = playerDrawCards(state, playerId)
    if (!result.ok) return result.reason
    gameState.value = result.state
  } else {
    drawCount = 1
    gameState.value = drawCardToPlayer(state, playerId)
  }

  const seats = loadSeats()
  const corner = seats ? cornerForPlayer(seats, playerId) : null
  if (corner) {
    store.triggerDrawAnimation(playerId, corner, drawCount)
  }

  syncAllHands()
  return null
}

function undo() {
  if (!gameState.value) return
  gameState.value = undoLastAction(gameState.value)
  syncAllHands()
}

function getBoardConnection(): PeerConnection | null {
  const store = useRoomStore()
  return store.connectedPlayers[0]?.connection ?? null
}

function sendToBoard(msg: RoomMessage) {
  const conn = getBoardConnection()
  if (conn) send(conn, msg)
}

function sendPlayCard(cardId: string, chosenColor?: CardColor) {
  const store = useRoomStore()
  sendToBoard({
    type: 'play-card',
    playerId: store.playerId,
    cardId,
    chosenColor,
  })
}

function sendRequestDraw() {
  const store = useRoomStore()
  sendToBoard({ type: 'request-draw', playerId: store.playerId })
}

function sendDeclareOneCard() {
  const store = useRoomStore()
  sendToBoard({ type: 'declare-onecard', playerId: store.playerId })
}

function sendHandPreview(cardId: string | null) {
  const store = useRoomStore()
  sendToBoard({ type: 'hand-preview', playerId: store.playerId, cardId })
}

function destroy() {
  const store = useRoomStore()
  clearJoinPending()
  for (const p of store.connectedPlayers) {
    p.connection.close()
  }
  peer.value?.destroy()
  peer.value = null
  gameState.value = null
  store.reset()
}

export function usePeerRoom() {
  return {
    peer,
    gameState,
    hostRoom,
    joinRoom,
    startGame,
    restartGame,
    continueGame,
    drawToPlayer,
    drawForPlayer,
    undo,
    sendPlayCard,
    sendRequestDraw,
    sendDeclareOneCard,
    sendHandPreview,
    destroy,
    syncAllHands,
  }
}
