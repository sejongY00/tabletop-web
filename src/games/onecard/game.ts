import { createDeck, drawRandom, returnToDeckRandom } from './deck'
import { popAction, pushAction } from './history'
import { canPlayCard, cardNeedsColorChoice } from './rules'
import type {
  Card,
  CardColor,
  DrawCardsResult,
  GameAction,
  GameState,
  PlayCardResult,
  PlayerInfo,
  PublicGameState,
  TurnDirection,
} from './types'

const INITIAL_HAND_SIZE = 7

function updatePlayerCounts(players: PlayerInfo[], hands: Record<string, Card[]>): PlayerInfo[] {
  return players.map((p) => ({
    ...p,
    handCount: hands[p.id]?.length ?? 0,
  }))
}

function drawStartCard(deck: Card[]): { card: Card; deck: Card[] } | null {
  let current = deck
  for (let i = 0; i < 20; i++) {
    const result = drawRandom(current)
    if (!result) return null
    if (result.card.value !== 'wild4') {
      return result
    }
    current = result.deck
  }
  return drawRandom(deck)
}

export function createGame(playerIds: string[], playerNames: Record<string, string>): GameState {
  let deck = createDeck()
  const hands: Record<string, Card[]> = {}

  for (const id of playerIds) {
    const cards: Card[] = []
    for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
      const result = drawRandom(deck)
      if (!result) break
      cards.push(result.card)
      deck = result.deck
    }
    hands[id] = cards
  }

  const startResult = drawStartCard(deck)
  const topCard = startResult?.card ?? null
  if (startResult) deck = startResult.deck

  const discardPile: Card[] = topCard ? [topCard] : []
  let activeColor: CardColor | null = topCard && topCard.color !== 'wild' ? topCard.color : null

  const players: PlayerInfo[] = playerIds.map((id) => ({
    id,
    name: playerNames[id] ?? `플레이어 ${id.slice(0, 4)}`,
    handCount: hands[id]?.length ?? 0,
    declaredOneCard: false,
  }))

  return {
    phase: 'playing',
    deck,
    discardPile,
    hands,
    players,
    currentTurnIndex: 0,
    turnOrder: [...playerIds],
    turnDirection: 1,
    drawPenalty: 0,
    activeColor,
    winnerId: null,
    history: [],
  }
}

export function getTopCard(state: GameState): Card | null {
  return state.discardPile[state.discardPile.length - 1] ?? null
}

export function getCurrentPlayerId(state: GameState): string | null {
  return state.turnOrder[state.currentTurnIndex] ?? null
}

export function drawCardToPlayer(state: GameState, playerId: string): GameState {
  const result = drawRandom(state.deck)
  if (!result) return state

  const newHands = {
    ...state.hands,
    [playerId]: [...(state.hands[playerId] ?? []), result.card],
  }

  const action: GameAction = { type: 'draw', playerId, card: result.card }

  return {
    ...state,
    deck: result.deck,
    hands: newHands,
    players: resetDeclarations(updatePlayerCounts(state.players, newHands)),
    history: pushAction(state.history, action),
  }
}

export function playerDrawCards(state: GameState, playerId: string): DrawCardsResult {
  if (state.phase !== 'playing') return { ok: false, reason: '게임이 진행 중이 아닙니다.' }
  if (!state.turnOrder.includes(playerId)) {
    return { ok: false, reason: '이미 패를 모두 낸 플레이어입니다.' }
  }
  if (getCurrentPlayerId(state) !== playerId) return { ok: false, reason: '내 턴이 아닙니다.' }

  const count = state.drawPenalty > 0 ? state.drawPenalty : 1
  let next = state

  for (let i = 0; i < count; i++) {
    const result = drawRandom(next.deck)
    if (!result) return { ok: false, reason: '덱에 카드가 없습니다.' }
    const newHands = {
      ...next.hands,
      [playerId]: [...(next.hands[playerId] ?? []), result.card],
    }
    next = {
      ...next,
      deck: result.deck,
      hands: newHands,
      players: resetDeclarations(updatePlayerCounts(next.players, newHands)),
      history: pushAction(next.history, { type: 'draw', playerId, card: result.card }),
    }
  }

  next = {
    ...next,
    drawPenalty: 0,
    ...advanceTurn(next),
  }

  return { ok: true, state: next }
}

export function playCard(
  state: GameState,
  playerId: string,
  cardId: string,
  chosenColor?: CardColor,
): PlayCardResult {
  if (state.phase !== 'playing') return { ok: false, reason: '게임이 진행 중이 아닙니다.' }
  if (!state.turnOrder.includes(playerId)) {
    return { ok: false, reason: '이미 패를 모두 낸 플레이어입니다.' }
  }
  if (getCurrentPlayerId(state) !== playerId) return { ok: false, reason: '내 턴이 아닙니다.' }

  const topCard = getTopCard(state)
  if (!topCard) return { ok: false, reason: '버린 더미가 없습니다.' }

  const hand = state.hands[playerId] ?? []
  const card = hand.find((c) => c.id === cardId)
  if (!card) return { ok: false, reason: '카드를 찾을 수 없습니다.' }

  if (!canPlayCard(card, topCard, state.activeColor, state.drawPenalty)) {
    return { ok: false, reason: '낼 수 없는 카드입니다.' }
  }

  if (cardNeedsColorChoice(card) && !chosenColor) {
    return { ok: false, reason: '색상을 선택해주세요.' }
  }

  const newHand = hand.filter((c) => c.id !== cardId)
  const playedCard = cardNeedsColorChoice(card) && chosenColor
    ? { ...card, color: chosenColor }
    : card

  const prevTop = topCard
  const prevActiveColor = state.activeColor
  const prevTurnIndex = state.currentTurnIndex
  const prevDirection = state.turnDirection
  const prevDrawPenalty = state.drawPenalty

  let next: GameState = {
    ...state,
    hands: { ...state.hands, [playerId]: newHand },
    discardPile: [...state.discardPile, playedCard],
    activeColor: cardNeedsColorChoice(card) ? chosenColor! : playedCard.color,
    players: updatePlayerCounts(
      state.players.map((p) =>
        p.id === playerId ? { ...p, declaredOneCard: false } : p,
      ),
      { ...state.hands, [playerId]: newHand },
    ),
    history: pushAction(state.history, {
      type: 'play',
      playerId,
      card: playedCard,
      chosenColor,
      prevTop,
      prevActiveColor,
      prevTurnIndex,
      prevDirection,
      prevDrawPenalty,
    }),
  }

  if (newHand.length === 0) {
    next = { ...next, phase: 'round_won', winnerId: playerId }
    return { ok: true, state: next }
  }

  next = applyCardEffect(next, playedCard)
  return { ok: true, state: next }
}

function applyCardEffect(state: GameState, card: Card): GameState {
  const playerCount = state.turnOrder.length
  let next = { ...state }

  switch (card.value) {
    case 'skip':
      next = { ...next, ...advanceTurn(next) }
      next = { ...next, ...advanceTurn(next) }
      break
    case 'reverse':
      if (playerCount === 2) {
        next = { ...next, ...advanceTurn(next) }
        next = { ...next, ...advanceTurn(next) }
      } else {
        next = { ...next, turnDirection: (next.turnDirection * -1) as TurnDirection }
        next = { ...next, ...advanceTurn(next) }
      }
      break
    case 'draw2':
      next = { ...next, drawPenalty: next.drawPenalty + 2 }
      next = { ...next, ...advanceTurn(next) }
      break
    case 'wild4':
      next = { ...next, drawPenalty: next.drawPenalty + 4 }
      next = { ...next, ...advanceTurn(next) }
      break
    case 'wild':
      next = { ...next, ...advanceTurn(next) }
      break
    default:
      next = { ...next, drawPenalty: 0 }
      next = { ...next, ...advanceTurn(next) }
      break
  }

  return next
}

function advanceTurn(state: GameState): Pick<GameState, 'currentTurnIndex'> {
  const len = state.turnOrder.length
  if (len === 0) return { currentTurnIndex: 0 }
  let idx = state.currentTurnIndex + state.turnDirection
  if (idx < 0) idx = len - 1
  if (idx >= len) idx = 0
  return { currentTurnIndex: idx }
}

function resetDeclarations(players: PlayerInfo[]): PlayerInfo[] {
  return players.map((p) => ({ ...p, declaredOneCard: false }))
}

export function declareOneCard(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, declaredOneCard: true } : p,
    ),
  }
}

export function undoLastAction(state: GameState): GameState {
  const { action, history } = popAction(state.history)
  if (!action) return state

  if (action.type === 'draw') {
    const playerHand = state.hands[action.playerId] ?? []
    const newHand = playerHand.filter((c) => c.id !== action.card.id)
    const newHands = { ...state.hands, [action.playerId]: newHand }
    return {
      ...state,
      deck: returnToDeckRandom(state.deck, action.card),
      hands: newHands,
      players: updatePlayerCounts(state.players, newHands),
      history,
      phase: 'playing',
      winnerId: null,
    }
  }

  if (action.type === 'play') {
    const pile = [...state.discardPile]
    pile.pop()
    const hand = [...(state.hands[action.playerId] ?? []), action.card]
    const newHands = { ...state.hands, [action.playerId]: hand }
    return {
      ...state,
      discardPile: pile,
      activeColor: action.prevActiveColor,
      currentTurnIndex: action.prevTurnIndex,
      turnDirection: action.prevDirection,
      drawPenalty: action.prevDrawPenalty,
      hands: newHands,
      players: updatePlayerCounts(state.players, newHands),
      history,
      phase: 'playing',
      winnerId: null,
    }
  }

  return state
}

export function canUndo(state: GameState): boolean {
  return state.history.length > 0
}

/** 패를 모두 낸 뒤 이어하기 — 승자는 제외하고 남은 플레이어끼리 계속 */
export function continueAfterRoundWin(state: GameState): GameState {
  if (state.phase !== 'round_won' || !state.winnerId) return state

  const winnerId = state.winnerId
  const remainingOrder = state.turnOrder.filter((id) => id !== winnerId)

  if (remainingOrder.length <= 1) {
    return { ...state, phase: 'finished' }
  }

  const { turnOrder, turnDirection } = state
  const winnerIdx = turnOrder.indexOf(winnerId)
  let idx = winnerIdx
  let nextPlayerId: string | undefined

  for (let i = 0; i < turnOrder.length - 1; i++) {
    idx = (idx + turnDirection + turnOrder.length) % turnOrder.length
    const candidate = turnOrder[idx]
    if (candidate !== winnerId) {
      nextPlayerId = candidate
      break
    }
  }

  const nextTurnIndex = nextPlayerId
    ? remainingOrder.indexOf(nextPlayerId)
    : 0

  return {
    ...state,
    phase: 'playing',
    winnerId: null,
    turnOrder: remainingOrder,
    currentTurnIndex: nextTurnIndex >= 0 ? nextTurnIndex : 0,
  }
}

export function toPublicState(state: GameState): PublicGameState {
  const winner = state.winnerId
    ? state.players.find((p) => p.id === state.winnerId)
    : null
  return {
    phase: state.phase,
    deckCount: state.deck.length,
    players: state.players,
    currentTurnIndex: state.currentTurnIndex,
    turnOrder: state.turnOrder,
    topCard: getTopCard(state),
    turnDirection: state.turnDirection,
    drawPenalty: state.drawPenalty,
    activeColor: state.activeColor,
    winnerId: state.winnerId,
    winnerName: winner?.name ?? null,
  }
}
