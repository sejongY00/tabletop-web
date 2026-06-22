<script setup lang="ts">
import { computed } from 'vue'
import type { BoardCorner } from '@/utils/boardLayout'
import OpponentHandFan from './OpponentHandFan.vue'

const props = withDefaults(defineProps<{
  corner: BoardCorner
  playerName: string
  handCount: number
  isTurn?: boolean
  previewIndex?: number | null
  showDraw?: boolean
  drawDisabled?: boolean
}>(), {
  isTurn: false,
  previewIndex: null,
  showDraw: false,
  drawDisabled: false,
})

const emit = defineEmits<{
  draw: []
}>()

const fanPosition = computed((): 'top' | 'bottom' => (
  props.corner === 'top' ? 'top' : 'bottom'
))

const large = computed(() => props.corner === 'top' || props.corner === 'bottom')
</script>

<template>
  <div class="corner-zone" :class="[`corner-${corner}`, { 'is-turn': isTurn }]">
    <!--
      배치 기준: 각 모서리에 앉아 테이블 중앙을 바라볼 때
      - 패 좌측 = 이름
      - 패 우측 = 카드뽑기
      - 패 상단 = 테이블 쪽 가장자리
    -->
    <div class="corner-content">
      <!-- 아래: [뽑기][이름][패] -->
      <template v-if="corner === 'bottom'">
        <button
          v-if="showDraw"
          type="button"
          class="draw-btn"
          :class="{ 'is-turn': isTurn }"
          :disabled="drawDisabled"
          @click="emit('draw')"
        >
          {{ playerName }} 카드뽑기
        </button>
        <div class="fan-row">
          <span class="player-name" :class="{ 'is-turn': isTurn }">{{ playerName }}</span>
          <div class="corner-inner">
            <OpponentHandFan
              :count="handCount"
              :position="fanPosition"
              :is-turn="isTurn"
              :preview-index="previewIndex"
              :large="large"
              compact
            />
          </div>
        </div>
      </template>

      <!-- 위: [패][이름][뽑기] -->
      <template v-else-if="corner === 'top'">
        <div class="fan-row">
          <div class="corner-inner">
            <OpponentHandFan
              :count="handCount"
              :position="fanPosition"
              :is-turn="isTurn"
              :preview-index="previewIndex"
              :large="large"
              compact
            />
          </div>
          <span class="player-name" :class="{ 'is-turn': isTurn }">{{ playerName }}</span>
        </div>
        <button
          v-if="showDraw"
          type="button"
          class="draw-btn"
          :class="{ 'is-turn': isTurn }"
          :disabled="drawDisabled"
          @click="emit('draw')"
        >
          {{ playerName }} 카드뽑기
        </button>
      </template>

      <!-- 왼쪽: [뽑기][패][이름] — 좌측=아래, 우측=위 -->
      <template v-else-if="corner === 'left'">
        <div class="sideways-stack">
          <button
            v-if="showDraw"
            type="button"
            class="draw-btn"
            :class="{ 'is-turn': isTurn }"
            :disabled="drawDisabled"
            @click="emit('draw')"
          >
            {{ playerName }} 카드뽑기
          </button>
          <div class="sideways-fan-slot">
            <div class="corner-inner sideways side-left">
              <OpponentHandFan
                :count="handCount"
                :position="fanPosition"
                :is-turn="isTurn"
                :preview-index="previewIndex"
                compact
              />
            </div>
          </div>
          <span class="player-name" :class="{ 'is-turn': isTurn }">{{ playerName }}</span>
        </div>
      </template>

      <!-- 오른쪽: [이름][패][뽑기] — 좌측=위, 우측=아래 -->
      <template v-else>
        <div class="sideways-stack">
          <span class="player-name" :class="{ 'is-turn': isTurn }">{{ playerName }}</span>
          <div class="sideways-fan-slot">
            <div class="corner-inner sideways side-right">
              <OpponentHandFan
                :count="handCount"
                :position="fanPosition"
                :is-turn="isTurn"
                :preview-index="previewIndex"
                compact
              />
            </div>
          </div>
          <button
            v-if="showDraw"
            type="button"
            class="draw-btn"
            :class="{ 'is-turn': isTurn }"
            :disabled="drawDisabled"
            @click="emit('draw')"
          >
            {{ playerName }} 카드뽑기
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.corner-zone {
  min-width: 0;
}

.corner-top { grid-area: top; justify-self: center; }
.corner-bottom { grid-area: bottom; justify-self: center; }
.corner-left { grid-area: left; align-self: center; justify-self: start; }
.corner-right { grid-area: right; align-self: center; justify-self: end; }

.corner-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.fan-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.player-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #aaa;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;
}

.corner-top .player-name,
.corner-bottom .player-name {
  font-size: 1.05rem;
}

.player-name.is-turn {
  color: #f1c40f;
}

/* 모서리에서 중앙을 바라볼 때 정방향 */
.corner-top .player-name {
  transform: rotate(180deg);
}

.corner-left .player-name {
  transform: rotate(90deg);
}

.corner-right .player-name {
  transform: rotate(-90deg);
}

.sideways-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.sideways-fan-slot {
  /* 회전 후 패가 차지하는 영역(280×120)을 분리해 이름·버튼과 겹치지 않게 */
  width: 140px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.corner-left .draw-btn,
.corner-left .player-name,
.corner-right .draw-btn,
.corner-right .player-name {
  position: relative;
  z-index: 350;
}

.corner-inner.side-left.sideways {
  transform: rotate(90deg);
  width: 280px;
  flex-shrink: 0;
}

.corner-inner.side-right.sideways {
  transform: rotate(-90deg);
  width: 280px;
  flex-shrink: 0;
}

.corner-inner.sideways :deep(.fan) {
  width: min(100%, 280px);
  height: 100px;
}

.draw-btn {
  padding: 8px 14px;
  border-radius: 18px;
  border: 2px solid #444;
  background: rgba(42, 42, 74, 0.9);
  color: #ccc;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.draw-btn.is-turn {
  border-color: #f1c40f;
  background: rgba(241, 196, 15, 0.15);
  color: #f1c40f;
}

.draw-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.corner-top .draw-btn {
  transform: rotate(180deg);
}

.corner-top .draw-btn:active:not(:disabled) {
  transform: rotate(180deg) scale(0.97);
}

.corner-bottom .draw-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.corner-left .draw-btn {
  transform: rotate(90deg);
}

.corner-left .draw-btn:active:not(:disabled) {
  transform: rotate(90deg) scale(0.97);
}

.corner-right .draw-btn {
  transform: rotate(-90deg);
}

.corner-right .draw-btn:active:not(:disabled) {
  transform: rotate(-90deg) scale(0.97);
}

.corner-left .draw-btn,
.corner-right .draw-btn {
  font-size: 0.75rem;
  padding: 6px 10px;
}
</style>
