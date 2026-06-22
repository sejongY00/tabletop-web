import type { Card, CardColor, CardValue } from './types'

export const COLOR_STYLES: Record<CardColor, { bg: string; text: string; label: string }> = {
  red: { bg: '#c0392b', text: '#fff', label: '빨강' },
  yellow: { bg: '#f1c40f', text: '#1a1a1a', label: '노랑' },
  green: { bg: '#27ae60', text: '#fff', label: '초록' },
  blue: { bg: '#2980b9', text: '#fff', label: '파랑' },
  wild: { bg: '#2c3e50', text: '#fff', label: '와일드' },
}

export function getCardLabel(value: CardValue): string {
  const map: Record<string, string> = {
    skip: '⊘',
    reverse: '⇄',
    draw2: '+2',
    wild: '★',
    wild4: '+4',
  }
  return map[value] ?? value
}

export function getCardDisplayColor(card: Card, activeColor: CardColor | null): CardColor {
  if (card.color !== 'wild') return card.color
  return activeColor ?? 'wild'
}
