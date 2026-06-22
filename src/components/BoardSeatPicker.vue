<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import {
  CORNERS_CLOCKWISE,
  CORNER_LABELS,
  dropPlayerOnCorner,
  dropPlayerOnPool,
  type BoardCorner,
  type SeatMap,
} from '@/utils/boardLayout'

const props = defineProps<{
  seats: SeatMap
  players: { id: string; name: string }[]
}>()

const emit = defineEmits<{
  'update:seats': [seats: SeatMap]
}>()

type DropZone = BoardCorner | 'pool'
type DragSource = DropZone

interface DragState {
  playerId: string
  from: DragSource
}

const dragging = ref<DragState | null>(null)
const hoverZone = ref<DropZone | null>(null)
const ghostPos = ref({ x: 0, y: 0 })

const assignedIds = computed(() => new Set(
  CORNERS_CLOCKWISE.map((c) => props.seats[c]).filter(Boolean) as string[],
))

const unassignedPlayers = computed(() =>
  props.players.filter((p) => !assignedIds.value.has(p.id)),
)

function playerAt(corner: BoardCorner) {
  const id = props.seats[corner]
  return props.players.find((p) => p.id === id) ?? null
}

function playerName(playerId: string) {
  return props.players.find((p) => p.id === playerId)?.name ?? ''
}

function zoneFromElement(el: Element | null): DropZone | null {
  const zone = el?.closest('[data-seat-drop]') as HTMLElement | null
  if (!zone) return null
  const value = zone.dataset.seatDrop
  if (value === 'pool') return 'pool'
  if (CORNERS_CLOCKWISE.includes(value as BoardCorner)) return value as BoardCorner
  return null
}

function updateHover(clientX: number, clientY: number) {
  hoverZone.value = zoneFromElement(document.elementFromPoint(clientX, clientY))
}

function finishDrag(clientX: number, clientY: number) {
  if (!dragging.value) return

  const zone = zoneFromElement(document.elementFromPoint(clientX, clientY))
  const { playerId, from } = dragging.value

  if (zone && zone !== from) {
    if (zone === 'pool') {
      emit('update:seats', dropPlayerOnPool(props.seats, playerId))
    } else {
      emit('update:seats', dropPlayerOnCorner(props.seats, zone, playerId))
    }
  }

  dragging.value = null
  hoverZone.value = null
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  ghostPos.value = { x: e.clientX, y: e.clientY }
  updateHover(e.clientX, e.clientY)
}

function onPointerUp(e: PointerEvent) {
  finishDrag(e.clientX, e.clientY)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

function startDrag(e: PointerEvent, playerId: string, from: DragSource) {
  if (e.button !== 0) return
  e.preventDefault()

  dragging.value = { playerId, from }
  ghostPos.value = { x: e.clientX, y: e.clientY }
  hoverZone.value = from

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
})
</script>

<template>
  <div class="seat-picker" :class="{ 'is-dragging': dragging }">
    <p class="seat-hint">
      가운데 플레이어를 드래그해 자리에 놓으세요. 이미 있는 자리면 서로 바뀝니다.
    </p>

    <div class="seat-table">
      <div
        v-for="corner in CORNERS_CLOCKWISE"
        :key="corner"
        class="seat-cell"
        :class="[
          `cell-${corner}`,
          { 'drop-hover': hoverZone === corner && dragging?.from !== corner },
        ]"
        :data-seat-drop="corner"
      >
        <span class="corner-label">{{ CORNER_LABELS[corner] }}</span>
        <div class="corner-slot">
          <div
            v-if="playerAt(corner)"
            class="player-chip seated-chip"
            :class="{ dragging: dragging?.playerId === playerAt(corner)!.id }"
            @pointerdown="startDrag($event, playerAt(corner)!.id, corner)"
          >
            {{ playerAt(corner)!.name }}
          </div>
          <span v-else class="corner-empty">놓기</span>
        </div>
      </div>

      <div
        class="seat-center"
        :class="{ 'drop-hover': hoverZone === 'pool' && dragging?.from !== 'pool' }"
        data-seat-drop="pool"
      >
        <span class="table-label">미배치 {{ unassignedPlayers.length }}명</span>
        <TransitionGroup name="pool-chip" tag="div" class="pool-slot">
          <div
            v-for="p in unassignedPlayers"
            :key="p.id"
            class="player-chip pool-chip"
            :class="{ dragging: dragging?.playerId === p.id }"
            @pointerdown="startDrag($event, p.id, 'pool')"
          >
            {{ p.name }}
          </div>
        </TransitionGroup>
        <p v-if="unassignedPlayers.length === 0" class="pool-note">모두 자리에 배치됨</p>
        <p v-else class="pool-note">여기로 끌어오면 자리에서 빠짐</p>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="dragging"
        class="drag-ghost"
        :style="{ left: `${ghostPos.x}px`, top: `${ghostPos.y}px` }"
      >
        {{ playerName(dragging.playerId) }}
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.seat-picker {
  width: 100%;
  max-width: 440px;
  touch-action: pan-y;
}

.seat-picker.is-dragging {
  touch-action: none;
  user-select: none;
}

.seat-hint {
  font-size: 0.85rem;
  color: #888;
  text-align: center;
  margin-bottom: 12px;
  line-height: 1.4;
}

.seat-table {
  display: grid;
  grid-template-areas:
    ". top ."
    "left center right"
    ". bottom .";
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  padding: 12px;
  background: rgba(42, 42, 74, 0.5);
  border-radius: 12px;
}

.seat-cell,
.seat-center {
  border: 2px dashed #444;
  border-radius: 10px;
  background: rgba(26, 26, 46, 0.6);
  transition: border-color 0.15s, background 0.15s;
}

.seat-cell.drop-hover,
.seat-center.drop-hover {
  border-color: #6c5ce7;
  background: rgba(108, 92, 231, 0.12);
}

.seat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  min-width: 96px;
}

.cell-top { grid-area: top; justify-self: center; }
.cell-left { grid-area: left; align-self: center; }
.cell-right { grid-area: right; align-self: center; }
.cell-bottom { grid-area: bottom; justify-self: center; }

.seat-center {
  grid-area: center;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 12px 14px;
  min-width: 148px;
  max-width: 200px;
}

.corner-label,
.table-label {
  font-size: 0.75rem;
  color: #888;
  text-align: center;
}

.table-label {
  font-weight: 600;
  color: #aaa;
}

.corner-slot,
.pool-slot {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  align-items: center;
}

.pool-slot {
  flex-direction: column;
  align-items: stretch;
  max-height: 180px;
  overflow-y: auto;
}

.player-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 2px solid #444;
  background: #2a2a4a;
  color: #eee;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: grab;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s, transform 0.15s, border-color 0.15s;
}

.player-chip:active {
  cursor: grabbing;
}

.player-chip.dragging {
  opacity: 0.35;
}

.seated-chip {
  padding: 6px 10px;
  font-size: 0.8rem;
  width: 100%;
  text-align: center;
}

.pool-chip {
  width: 100%;
  text-align: center;
}

.corner-empty {
  color: #555;
  font-size: 0.75rem;
}

.pool-note {
  margin: 0;
  font-size: 0.68rem;
  color: #666;
  text-align: center;
  line-height: 1.3;
}

.drag-ghost {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transform: translate(-50%, -50%);
  padding: 8px 14px;
  border-radius: 10px;
  border: 2px solid #6c5ce7;
  background: rgba(42, 42, 74, 0.95);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}

.pool-chip-enter-active,
.pool-chip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.pool-chip-enter-from,
.pool-chip-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.pool-chip-move {
  transition: transform 0.2s ease;
}
</style>
