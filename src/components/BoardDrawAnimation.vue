<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { DrawAnimationPayload } from '@/stores/roomStore'
import { PILE_CARD } from '@/components/cardTypes'
import CardView from './CardView.vue'

const props = defineProps<{
  payload: DrawAnimationPayload | null
}>()

const emit = defineEmits<{
  complete: []
}>()

const active = ref<DrawAnimationPayload | null>(null)
const flightEls = ref<(HTMLElement | null)[]>([])

const pile = PILE_CARD.lg
const deckBack = { id: 'deck-fly', color: 'wild' as const, value: '0' as const }

function setFlightRef(i: number, el: unknown) {
  flightEls.value[i] = el as HTMLElement | null
}

function centerOf(el: Element) {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

async function animateCard(
  el: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  corner: DrawAnimationPayload['corner'],
  index: number,
) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const arcLift = Math.min(64, Math.max(28, Math.hypot(dx, dy) * 0.12))
  const startRotate = corner === 'top' ? 6 : corner === 'bottom' ? -4 : 0
  const spread = (index - (active.value!.count - 1) / 2) * 8

  el.style.left = `${from.x}px`
  el.style.top = `${from.y}px`

  const anim = el.animate([
    {
      transform: `translate(-50%, -50%) translate(${spread}px, 0) scale(0.45) rotate(${startRotate}deg)`,
      opacity: 0.9,
    },
    {
      transform: `translate(-50%, -50%) translate(${dx * 0.5 + spread}px, ${dy * 0.5 - arcLift}px) scale(0.75) rotate(${startRotate * 0.2}deg)`,
      opacity: 1,
      offset: 0.45,
    },
    {
      transform: `translate(-50%, -50%) translate(${dx + spread}px, ${dy}px) scale(0.92) rotate(0deg)`,
      opacity: 1,
    },
  ], {
    duration: 460,
    easing: 'cubic-bezier(0.22, 0.85, 0.32, 1)',
    fill: 'forwards',
    delay: index * 110,
  })

  await anim.finished.catch(() => {})
}

async function runAnimation(payload: DrawAnimationPayload) {
  active.value = payload
  flightEls.value = []

  await nextTick()
  await nextTick()
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()))
  })

  const fromEl = document.querySelector('[data-board-deck]')
  const toEl = document.querySelector(`[data-board-corner="${payload.corner}"] .corner-inner`)
    ?? document.querySelector(`[data-board-corner="${payload.corner}"]`)

  if (!fromEl || !toEl) {
    active.value = null
    emit('complete')
    return
  }

  const from = centerOf(fromEl)
  const to = centerOf(toEl)

  const tasks: Promise<void>[] = []
  for (let i = 0; i < payload.count; i++) {
    const el = flightEls.value[i]
    if (el) tasks.push(animateCard(el, from, to, payload.corner, i))
  }

  await Promise.all(tasks)

  active.value = null
  emit('complete')
}

watch(
  () => props.payload?.id,
  (id) => {
    if (id != null && props.payload) {
      runAnimation(props.payload)
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-for="i in active?.count ?? 0"
      :key="`${active?.id}-${i}`"
      :ref="(el) => setFlightRef(i - 1, el)"
      class="draw-flight"
    >
      <CardView
        :card="deckBack"
        face-down
        :dimensions="{ width: pile.width, height: pile.height }"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.draw-flight {
  position: fixed;
  z-index: 500;
  pointer-events: none;
  will-change: transform, opacity;
}

.draw-flight :deep(.card) {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
}
</style>
