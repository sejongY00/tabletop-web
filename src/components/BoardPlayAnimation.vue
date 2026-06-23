<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { PlayAnimationPayload } from '@/stores/roomStore'
import { PILE_CARD } from '@/components/cardTypes'
import CardView from './CardView.vue'

const props = defineProps<{
  payload: PlayAnimationPayload | null
}>()

const emit = defineEmits<{
  complete: []
}>()

const visible = ref(false)
const flightRef = ref<HTMLElement | null>(null)
const activePayload = ref<PlayAnimationPayload | null>(null)

const pile = PILE_CARD.lg

function centerOf(el: Element) {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

async function runAnimation(payload: PlayAnimationPayload) {
  activePayload.value = payload
  visible.value = true

  await nextTick()
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()))
  })

  const fromEl = document.querySelector(`[data-board-corner="${payload.corner}"] .corner-inner`)
    ?? document.querySelector(`[data-board-corner="${payload.corner}"]`)
  const toEl = document.querySelector('[data-discard-pile]')
  const el = flightRef.value

  if (!fromEl || !toEl || !el) {
    visible.value = false
    activePayload.value = null
    emit('complete')
    return
  }

  const from = centerOf(fromEl)
  const to = centerOf(toEl)
  const dx = to.x - from.x
  const dy = to.y - from.y
  const arcLift = Math.min(72, Math.max(32, Math.hypot(dx, dy) * 0.15))

  el.style.left = `${from.x}px`
  el.style.top = `${from.y}px`

  const startRotate = payload.corner === 'top' ? 8 : payload.corner === 'bottom' ? -6 : 0

  try {
    const anim = el.animate([
      {
        transform: `translate(-50%, -50%) translate(0px, 0px) scale(0.5) rotate(${startRotate}deg)`,
        opacity: 0.85,
      },
      {
        transform: `translate(-50%, -50%) translate(${dx * 0.5}px, ${dy * 0.5 - arcLift}px) scale(0.82) rotate(${startRotate * 0.3}deg)`,
        opacity: 1,
        offset: 0.42,
      },
      {
        transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(1) rotate(0deg)`,
        opacity: 1,
      },
    ], {
      duration: 520,
      easing: 'cubic-bezier(0.22, 0.85, 0.32, 1)',
      fill: 'forwards',
    })

    await anim.finished
  } catch {
    // interrupted
  }

  visible.value = false
  activePayload.value = null
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
      v-if="visible && activePayload"
      ref="flightRef"
      class="play-flight"
    >
      <CardView
        :card="activePayload.card"
        :active-color="activePayload.activeColor"
        :dimensions="{ width: pile.width, height: pile.height }"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.play-flight {
  position: fixed;
  z-index: 500;
  pointer-events: none;
  will-change: transform, opacity;
}

.play-flight :deep(.card) {
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
}
</style>
