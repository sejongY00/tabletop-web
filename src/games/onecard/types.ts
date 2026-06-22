export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild'

export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4'

export interface Card {
  id: string
  color: CardColor
  value: CardValue
}

export interface PlayerInfo {
  id: string
  name: string
  handCount: number
  declaredOneCard?: boolean
}

export type GamePhase = 'waiting' | 'playing' | 'paused' | 'round_won' | 'finished'

export type TurnDirection = 1 | -1

export interface PublicGameState {
  phase: GamePhase
  deckCount: number
  players: PlayerInfo[]
  currentTurnIndex: number
  turnOrder: string[]
  topCard: Card | null
  turnDirection: TurnDirection
  drawPenalty: number
  activeColor: CardColor | null
  winnerId: string | null
  winnerName: string | null
}

export interface GameState {
  phase: GamePhase
  deck: Card[]
  discardPile: Card[]
  hands: Record<string, Card[]>
  players: PlayerInfo[]
  currentTurnIndex: number
  turnOrder: string[]
  turnDirection: TurnDirection
  drawPenalty: number
  activeColor: CardColor | null
  winnerId: string | null
  history: GameAction[]
}

export type GameAction =
  | { type: 'draw'; playerId: string; card: Card }
  | {
      type: 'play'
      playerId: string
      card: Card
      chosenColor?: CardColor
      prevTop: Card
      prevActiveColor: CardColor | null
      prevTurnIndex: number
      prevDirection: TurnDirection
      prevDrawPenalty: number
    }

export type RoomRole = 'board' | 'player'

export interface SessionInfo {
  roomCode: string
  role: RoomRole
  playerId: string
  playerName?: string
}

export type PlayCardResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: string }

export type DrawCardsResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: string }
