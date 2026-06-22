import type { Card, CardColor, CardValue } from './types'

const COLORS: CardColor[] = ['red', 'yellow', 'green', 'blue']
const NUMBER_VALUES: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const ACTION_VALUES: CardValue[] = ['skip', 'reverse', 'draw2']

let cardIdCounter = 0

function makeCard(color: CardColor, value: CardValue): Card {
  return { id: `card-${cardIdCounter++}`, color, value }
}

export function createDeck(): Card[] {
  cardIdCounter = 0
  const deck: Card[] = []

  for (const color of COLORS) {
    deck.push(makeCard(color, '0'))
    for (const value of NUMBER_VALUES.slice(1)) {
      deck.push(makeCard(color, value), makeCard(color, value))
    }
    for (const value of ACTION_VALUES) {
      deck.push(makeCard(color, value), makeCard(color, value))
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push(makeCard('wild', 'wild'), makeCard('wild', 'wild4'))
  }

  return shuffle(deck)
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = result[i]!
    result[i] = result[j]!
    result[j] = tmp
  }
  return result
}

export function drawRandom(deck: Card[]): { card: Card; deck: Card[] } | null {
  if (deck.length === 0) return null
  const index = Math.floor(Math.random() * deck.length)
  const card = deck[index]!
  const newDeck = [...deck.slice(0, index), ...deck.slice(index + 1)]
  return { card, deck: newDeck }
}

export function returnToDeckRandom(deck: Card[], card: Card): Card[] {
  const index = Math.floor(Math.random() * (deck.length + 1))
  return [...deck.slice(0, index), card, ...deck.slice(index)]
}
