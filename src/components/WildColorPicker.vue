<script setup lang="ts">
import type { CardColor } from '@/games/onecard/types'
import { COLOR_STYLES } from '@/games/onecard/cardDisplay'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  select: [color: CardColor]
  cancel: []
}>()

const colors: CardColor[] = ['red', 'yellow', 'green', 'blue']
</script>

<template>
  <div v-if="visible" class="overlay" @click.self="emit('cancel')">
    <div class="picker">
      <h3>색상 선택</h3>
      <p class="desc">와일드 카드 색상을 고르세요</p>
      <div class="colors">
        <button
          v-for="color in colors"
          :key="color"
          type="button"
          class="color-btn"
          :style="{ background: COLOR_STYLES[color].bg, color: COLOR_STYLES[color].text }"
          @click="emit('select', color)"
        >
          {{ COLOR_STYLES[color].label }}
        </button>
      </div>
      <button type="button" class="cancel-btn" @click="emit('cancel')">취소</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 24px;
}

.picker {
  background: #2a2a4a;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 320px;
  text-align: center;
}

.picker h3 {
  font-size: 1.2rem;
  margin-bottom: 8px;
}

.desc {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 20px;
}

.colors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.color-btn {
  padding: 16px;
  border: 2px solid transparent;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.1s;
}

.color-btn:active {
  transform: scale(0.96);
}

.cancel-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px;
}
</style>
