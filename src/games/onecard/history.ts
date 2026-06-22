import type { GameAction } from './types'

export function pushAction(history: GameAction[], action: GameAction): GameAction[] {
  return [...history, action]
}

export function popAction(history: GameAction[]): { action: GameAction | null; history: GameAction[] } {
  if (history.length === 0) return { action: null, history }
  const action = history[history.length - 1]!
  return { action, history: history.slice(0, -1) }
}
