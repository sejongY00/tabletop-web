<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import type { Card, CardColor } from '@/games/onecard/types'
import { getPlayableCards } from '@/games/onecard/rules'
import CardView from './CardView.vue'

const props = defineProps<{
  cards: Card[]
  topCard?: Card | null
  activeColor?: CardColor | null
  drawPenalty?: number
  /** 내 턴일 때만 카드 내기 가능 */
  canPlay?: boolean
}>()

const canPlay = computed(() => props.canPlay ?? false)

const emit = defineEmits<{
  play: [cardId: string]
  'request-color': [cardId: string]
  'selection-change': [cardId: string | null]
}>()

const selectedId = ref<string | null>(null)
const fanRef = ref<HTMLElement | null>(null)
const fanWidthPx = ref(360)
const cardHeightPx = ref(120)
const cardWidthPx = ref(80)
const playDragThreshold = ref(72)

const dragCardId = ref<string | null>(null)
const dragStartY = ref(0)
const dragStartX = ref(0)
const dragCurrentY = ref(0)
const dragCurrentX = ref(0)
const isDragging = ref(false)
const justSelected = ref(false)

const cardDimensions = computed(() => ({
  width: cardWidthPx.value,
  height: cardHeightPx.value,
}))

const fanHeightPx = computed(() => Math.round(cardHeightPx.value * 1.15 + 48))

const playableIds = computed(() => {
  if (!props.topCard || !canPlay.value) return new Set<string>()
  return new Set(
    getPlayableCards(
      props.cards,
      props.topCard,
      props.activeColor ?? null,
      props.drawPenalty ?? 0,
    ).map((c) => c.id),
  )
})

const cardSpacing = computed(() => {
  const n = props.cards.length
  if (n <= 1) return 0
  const cardW = cardWidthPx.value
  return Math.min(cardW * 0.55, Math.max(24, (fanWidthPx.value - cardW) / (n - 1)))
})

function updateLayout() {
  const vh = window.innerHeight
  const vw = window.innerWidth

  const maxCardH = vh * 0.5
  const minCardH = vh < 400 ? 96 : 108
  const targetH = Math.max(minCardH, Math.min(maxCardH, vh * 0.48))
  cardHeightPx.value = Math.round(targetH)
  cardWidthPx.value = Math.round(targetH * (2 / 3))
  playDragThreshold.value = Math.round(targetH * 0.34)

  if (fanRef.value) {
    fanWidthPx.value = fanRef.value.clientWidth
  } else {
    fanWidthPx.value = Math.min(vw * 0.98, Math.max(360, props.cards.length * cardWidthPx.value * 0.45 + 120))
  }
}

onMounted(() => {
  updateLayout()
  window.addEventListener('resize', updateLayout)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLayout)
})

watch(selectedId, (cardId) => {
  emit('selection-change', cardId)
})

function getFanStyle(index: number, total: number) {
  const card = props.cards[index]
  if (!card) return {}

  const maxSpread = Math.min(16, 3 + total * 0.5)
  const step = total > 1 ? maxSpread / (total - 1) : 0
  const angle = total > 1 ? -maxSpread / 2 + step * index : 0
  const offset = total > 1 ? (index - (total - 1) / 2) * cardSpacing.value : 0

  const isSelected = selectedId.value === card.id
  const isActiveDrag = dragCardId.value === card.id

  if (isSelected) {
    const dragDeltaY = isActiveDrag ? dragStartY.value - dragCurrentY.value : 0
    const dragDeltaX = isActiveDrag ? dragCurrentX.value - dragStartX.value : 0
    const lift = -cardHeightPx.value * 0.42 - Math.max(0, dragDeltaY)
    const scale = isDragging.value ? 1.12 : 1.08

    return {
      transform: `translateX(${offset + dragDeltaX}px) translateY(${lift}px) rotate(0deg) scale(${scale})`,
      zIndex: 200,
      transition: isDragging.value ? 'none' : 'transform 0.25s ease',
      marginLeft: `-${cardWidthPx.value / 2}px`,
    }
  }

  return {
    transform: `translateX(${offset}px) translateY(0) rotate(${angle}deg) scale(1)`,
    zIndex: index,
    transition: 'transform 0.25s ease',
    marginLeft: `-${cardWidthPx.value / 2}px`,
  }
}

function handlePointerDown(e: PointerEvent, card: Card) {
  if (selectedId.value !== card.id) {
    selectedId.value = card.id
    justSelected.value = true
    return
  }

  if (!canPlay.value) {
    if (!justSelected.value) {
      selectedId.value = null
    }
    justSelected.value = false
    return
  }

  dragCardId.value = card.id
  dragStartY.value = e.clientY
  dragStartX.value = e.clientX
  dragCurrentY.value = e.clientY
  dragCurrentX.value = e.clientX
  isDragging.value = false
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function handlePointerMove(e: PointerEvent) {
  if (!dragCardId.value) return
  dragCurrentY.value = e.clientY
  dragCurrentX.value = e.clientX
  if (Math.abs(dragStartY.value - e.clientY) > 6) {
    isDragging.value = true
  }
}

function handlePointerUp(card: Card) {
  if (justSelected.value && selectedId.value === card.id && !dragCardId.value) {
    justSelected.value = false
    return
  }

  if (!canPlay.value) {
    dragCardId.value = null
    isDragging.value = false
    return
  }

  if (dragCardId.value !== card.id) return

  const deltaY = dragStartY.value - dragCurrentY.value

  if (isDragging.value && deltaY >= playDragThreshold.value) {
    if (playableIds.value.has(card.id)) {
      if (card.color === 'wild' || card.value === 'wild' || card.value === 'wild4') {
        emit('request-color', card.id)
      } else {
        emit('play', card.id)
      }
      selectedId.value = null
    }
  } else if (!isDragging.value) {
    selectedId.value = null
  }

  justSelected.value = false
  dragCardId.value = null
  isDragging.value = false
}

function clearSelection() {
  if (isDragging.value) return
  selectedId.value = null
  dragCardId.value = null
  justSelected.value = false
}

defineExpose({ clearSelection })
</script>

<template>
  <div class="hand-container">
    <div
      v-if="selectedId"
      class="backdrop"
      @click="clearSelection"
      @pointerdown.prevent="clearSelection"
    />

    <p v-if="selectedId && canPlay && playableIds.has(selectedId)" class="hint">
      ↑ 위로 드래그하여 내기
    </p>
    <p v-else-if="selectedId && canPlay" class="hint muted">
      낼 수 없는 카드 — 탭하여 접기
    </p>
    <p v-else-if="selectedId" class="hint muted">
      카드 상세 보기 — 탭하여 접기
    </p>

    <div
      ref="fanRef"
      class="hand-fan"
      :style="{ width: 'min(98vw, 960px)', height: `${fanHeightPx}px` }"
    >
      <div
        v-for="(card, index) in cards"
        :key="card.id"
        class="card-slot"
        :class="{ selected: selectedId === card.id, dragging: dragCardId === card.id && isDragging }"
        :style="getFanStyle(index, cards.length)"
        @pointerdown="handlePointerDown($event, card)"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp(card)"
        @pointercancel="handlePointerUp(card)"
      >
        <CardView
          :card="card"
          :active-color="activeColor"
          :selected="selectedId === card.id"
          :playable="canPlay && playableIds.has(card.id)"
          :dimensions="cardDimensions"
          size="md"
        />
      </div>
    </div>

    <p v-if="cards.length === 0" class="empty">패가 비어 있습니다</p>
  </div>
</template>

<style scoped>
.hand-container {
  width: 100%;
  max-height: 50vh;
  max-height: 50dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 0 1vw;
  position: relative;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.hint {
  position: fixed;
  left: 50%;
  bottom: calc(min(50vh, 50dvh) + min(24vh, 24dvh) + 12px);
  transform: translateX(-50%);
  font-size: 0.85rem;
  color: #f1c40f;
  z-index: 100;
  pointer-events: none;
  background: rgba(26, 26, 46, 0.9);
  padding: 6px 14px;
  border-radius: 8px;
  white-space: nowrap;
}

.hint.muted {
  color: #888;
}

.hand-fan {
  position: relative;
  margin: 0 auto;
  z-index: 60;
}

.card-slot {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform-origin: bottom center;
  touch-action: none;
  cursor: grab;
  -webkit-tap-highlight-color: transparent;
}

.card-slot.dragging {
  cursor: grabbing;
}

.card-slot:not(.selected) {
  cursor: pointer;
}

.empty {
  color: #888;
  font-size: 0.9rem;
  margin-top: 16px;
}
</style>
