<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CardViewSize } from '@/components/cardTypes'
import CardView from './CardView.vue'

const props = withDefaults(defineProps<{
  count: number
  position: 'top' | 'bottom'
  isTurn?: boolean
  large?: boolean
  compact?: boolean
  previewIndex?: number | null
}>(), {
  isTurn: false,
  large: false,
  compact: false,
  previewIndex: null,
})

const isHovered = ref(false)

const visibleCount = computed(() => Math.min(Math.max(props.count, 0), 14))

const cardSize = computed((): CardViewSize => (props.large ? '2xl' : 'md'))
const cardHalf = computed(() => (props.large ? 70 : 36))
const cardHeight = computed(() => (props.large ? 210 : 120))
const cardSpacing = computed(() => (props.large ? 28 : 18))
const previewLift = computed(() => Math.round(cardHeight.value * 0.42))
const maxSpread = computed(() => {
  const total = visibleCount.value
  if (props.large) return Math.min(42, 8 + total * 2.2)
  return Math.min(48, 10 + total * 3)
})

/** 상단 플레이어 fan은 좌우 반전 배치 → 강조는 패 인덱스 그대로 매칭 */
function isPreviewSlot(slotIndex: number) {
  if (props.previewIndex == null) return false
  return slotIndex === props.previewIndex
}

function slotOffset(slotIndex: number, total: number) {
  const raw = (slotIndex - (total - 1) / 2) * cardSpacing.value
  return props.position === 'top' ? -raw : raw
}

function cardStyle(index: number) {
  const total = visibleCount.value
  if (total <= 0) return { display: 'none' }

  const spread = maxSpread.value
  const step = total > 1 ? spread / (total - 1) : 0
  const angle = total > 1
    ? (props.position === 'top'
      ? spread / 2 - step * index
      : -spread / 2 + step * index)
    : 0
  const offset = slotOffset(index, total)

  const isPreview = isPreviewSlot(index)

  if (isPreview) {
    const lift = props.position === 'top' ? previewLift.value : -previewLift.value
    const previewRotate = props.position === 'top' ? 180 : 0

    return {
      transform: `translateX(${offset}px) translateY(${lift}px) rotate(${previewRotate}deg) scale(1.08)`,
      zIndex: 300,
      '--delay': `${index * 0.05}s`,
    }
  }

  const hoverSpread = isHovered.value ? 1.35 : 1
  const adjustedAngle = angle * hoverSpread
  const adjustedOffset = slotOffset(index, total) * hoverSpread
  const hoverLift = isHovered.value ? (props.large ? 20 : 14) : 0

  if (props.position === 'top') {
    return {
      transform: `translateX(${adjustedOffset}px) translateY(${hoverLift}px) rotate(${180 - adjustedAngle}deg)`,
      zIndex: index,
      '--delay': `${index * 0.05}s`,
    }
  }

  return {
    transform: `translateX(${adjustedOffset}px) translateY(${-hoverLift}px) rotate(${adjustedAngle}deg)`,
    zIndex: index,
    '--delay': `${index * 0.05}s`,
  }
}
</script>

<template>
  <div
    class="opponent-zone"
    :class="[position, { 'is-turn': isTurn, hovered: isHovered, large, compact }]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @touchstart.passive="isHovered = true"
    @touchend="isHovered = false"
  >
    <div class="fan" :class="{ empty: count === 0 }">
      <div
        v-for="i in visibleCount"
        :key="i"
        class="card-slot"
        :class="{ 'is-preview': isPreviewSlot(i - 1) }"
        :style="[cardStyle(i - 1), { marginLeft: `-${cardHalf}px` }]"
      >
        <div class="card-float">
          <CardView
            :card="{ id: `back-${i}`, color: 'wild', value: '0' }"
            face-down
            :selected="isPreviewSlot(i - 1)"
            :size="cardSize"
          />
        </div>
      </div>
      <p v-if="count === 0" class="empty-hand">패 없음</p>
    </div>
  </div>
</template>

<style scoped>
.opponent-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 8px 16px;
  transition: filter 0.2s;
}

.opponent-zone.large {
  padding: 12px 24px;
}

.opponent-zone.compact {
  padding: 0;
}

.opponent-zone.compact.large {
  padding: 0;
}

.opponent-zone.top {
  flex-direction: column;
}

.opponent-zone.bottom {
  flex-direction: column-reverse;
}

.opponent-zone.is-turn {
  filter: drop-shadow(0 0 16px rgba(241, 196, 15, 0.5));
}

.fan {
  position: relative;
  width: min(100%, 420px);
  height: 120px;
  display: flex;
  justify-content: center;
}

.opponent-zone.large .fan {
  width: min(92vw, 760px);
  height: 200px;
}

.opponent-zone.top .fan {
  align-items: flex-start;
}

.opponent-zone.bottom .fan {
  align-items: flex-end;
}

.opponent-zone.top .card-slot {
  top: 0;
  transform-origin: top center;
}

.opponent-zone.bottom .card-slot {
  bottom: 0;
  transform-origin: bottom center;
}

.card-slot {
  position: absolute;
  left: 50%;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-slot.is-preview {
  transition: transform 0.25s ease;
}

.card-slot .card-float {
  animation: cardBob 3s ease-in-out infinite;
  animation-delay: var(--delay, 0s);
}

.opponent-zone.top .card-slot .card-float {
  animation-name: cardBobTop;
}

.opponent-zone.bottom .card-slot .card-float {
  animation-name: cardBobBottom;
}

.opponent-zone.hovered .card-slot:not(.is-preview) .card-float {
  animation-play-state: paused;
}

.card-slot.is-preview .card-float {
  animation: none;
}

@keyframes cardBobTop {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}

@keyframes cardBobBottom {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}

.empty-hand {
  color: #555;
  font-size: 0.8rem;
  align-self: center;
  margin: auto;
}

.opponent-zone.large .empty-hand {
  font-size: 1rem;
}
</style>
