import type { Card, CardColor, CardValue } from './types'

export function getEffectiveColor(card: Card, activeColor: CardColor | null): CardColor {
  if (card.color !== 'wild' && card.color) return card.color
  return activeColor ?? 'wild'
}

export function canPlayCard(
  card: Card,
  topCard: Card,
  activeColor: CardColor | null,
  drawPenalty: number,
): boolean {
  if (drawPenalty > 0) {
    return card.value === 'draw2' || card.value === 'wild4'
  }

  if (card.color === 'wild') return true

  const topColor = getEffectiveColor(topCard, activeColor)
  if (card.color === topColor) return true
  if (card.value === topCard.value) return true

  return false
}

export function getPlayableCards(
  hand: Card[],
  topCard: Card,
  activeColor: CardColor | null,
  drawPenalty: number,
): Card[] {
  return hand.filter((c) => canPlayCard(c, topCard, activeColor, drawPenalty))
}

export function isActionCard(value: CardValue): boolean {
  return value === 'skip' || value === 'reverse' || value === 'draw2' || value === 'wild' || value === 'wild4'
}

export function cardNeedsColorChoice(card: Card): boolean {
  return card.color === 'wild'
}
