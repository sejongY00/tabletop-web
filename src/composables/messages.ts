import type { Card, CardColor, PublicGameState, RoomRole } from '@/games/onecard/types'

export type RoomMessage =
  | { type: 'join'; role: RoomRole; playerId: string; name: string }
  | { type: 'joined'; playerId: string; players: { id: string; name: string }[] }
  | { type: 'players-update'; players: { id: string; name: string }[] }
  | { type: 'reject'; reason: string }
  | { type: 'player-left'; playerId: string; players: { id: string; name: string }[] }
  | { type: 'game-start'; turnOrder: string[] }
  | { type: 'hand-update'; hand: Card[] }
  | { type: 'state-update'; state: PublicGameState }
  | { type: 'play-card'; playerId: string; cardId: string; chosenColor?: CardColor }
  | { type: 'request-draw'; playerId: string }
  | { type: 'declare-onecard'; playerId: string }
  | { type: 'hand-preview'; playerId: string; cardId: string | null }
  | { type: 'play-rejected'; reason: string }
  | { type: 'ping' }

export interface PeerConnection {
  open: boolean
  send: (data: unknown) => void
  close: () => void
}

export interface ConnectedPlayer {
  id: string
  name: string
  connection: PeerConnection
}
