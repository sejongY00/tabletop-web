<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '@/games/onecard/types'
import { PILE_CARD } from '@/components/cardTypes'
import CardView from './CardView.vue'

/** 원카드 덱 초기 장수 (108장) */
const FULL_DECK = 108

const props = withDefaults(defineProps<{
  large?: boolean
  count?: number | null
}>(), {
  large: false,
  count: null,
})

const pile = computed(() => (props.large ? PILE_CARD.lg : PILE_CARD.md))
const stepPx = computed(() => (props.large ? 4 : 3))

const visualStack = computed(() => {
  const c = props.count
  if (c == null) {
    return { layers: 3, depth: 1 }
  }
  if (c <= 0) {
    return { layers: 0, depth: 0 }
  }

  const depth = Math.max(0.12, Math.min(1, c / (FULL_DECK * 0.65)))

  let layers = 1
  if (c > 12) layers = 2
  if (c > 40) layers = 3

  return { layers, depth }
})

const cardDimensions = computed(() => {
  const squash = 1 - (1 - visualStack.value.depth) * 0.06
  return {
    width: pile.value.width,
    height: Math.round(pile.value.height * squash),
  }
})

const stackBox = computed(() => {
  const { depth, layers } = visualStack.value
  const maxOffset = Math.max(0, layers - 1) * stepPx.value * depth
  const heightTrim = (1 - depth) * (props.large ? 18 : 12)
  return {
    width: pile.value.stackWidth,
    height: Math.round(pile.value.stackHeight - heightTrim + maxOffset),
  }
})

const deckBackCard: Card = { id: 'deck-back', color: 'wild', value: '0' }

function layerStyle(layerIndex: number) {
  const { layers, depth } = visualStack.value
  const backIndex = layers - 1 - layerIndex
  const offset = backIndex * stepPx.value * depth
  return {
    top: `${offset}px`,
    left: `${offset}px`,
    zIndex: layerIndex,
  }
}
</script>

<template>
  <div class="deck" :class="{ large, empty: visualStack.layers === 0 }">
    <div
      class="deck-stack"
      :style="{ width: `${stackBox.width}px`, height: `${stackBox.height}px` }"
    >
      <template v-if="visualStack.layers > 0">
        <div
          v-for="i in visualStack.layers"
          :key="i"
          class="deck-card"
          :style="layerStyle(i - 1)"
        >
          <CardView
            :card="deckBackCard"
            face-down
            :size="large ? '2xl' : 'md'"
            :dimensions="cardDimensions"
          />
        </div>
      </template>
      <div v-else class="deck-empty" :style="cardDimensions" />
      <span v-if="count != null" class="deck-count">{{ count }}</span>
    </div>
  </div>
</template>

<style scoped>
.deck {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.deck-stack {
  position: relative;
  transition: width 0.35s ease, height 0.35s ease;
}

.deck-card {
  position: absolute;
  top: 0;
  left: 0;
  transition: top 0.35s ease, left 0.35s ease;
}

.deck-empty {
  position: absolute;
  top: 0;
  left: 0;
  border: 2px dashed #444;
  border-radius: 10px;
  background: rgba(26, 26, 46, 0.5);
}

.deck.large .deck-empty {
  border-width: 3px;
  border-radius: 12px;
}

.deck-count {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  min-width: 2em;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 800;
  text-align: center;
  pointer-events: none;
  line-height: 1.2;
  transition: transform 0.35s ease;
}

.deck.large .deck-count {
  font-size: 1.5rem;
  padding: 6px 14px;
  border-radius: 14px;
}

.deck.empty .deck-count {
  color: #888;
}
</style>
