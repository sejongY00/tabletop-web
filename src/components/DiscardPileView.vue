<script setup lang="ts">
import { computed } from 'vue'
import type { Card, CardColor } from '@/games/onecard/types'
import { PILE_CARD } from '@/components/cardTypes'
import CardView from './CardView.vue'

const props = withDefaults(defineProps<{
  topCard: Card | null
  activeColor?: CardColor | null
  large?: boolean
  showLabel?: boolean
}>(), {
  large: false,
  showLabel: false,
})

const pile = computed(() => (props.large ? PILE_CARD.lg : PILE_CARD.md))
</script>

<template>
  <div class="discard">
    <span v-if="showLabel" class="label">버린 더미</span>
    <div
      class="discard-slot"
      data-discard-pile
      :class="{ large }"
      :style="{ width: `${pile.stackWidth}px`, height: `${pile.stackHeight}px` }"
    >
      <CardView
        v-if="topCard"
        :card="topCard"
        :active-color="activeColor"
        :dimensions="{ width: pile.width, height: pile.height }"
      />
      <div v-else class="empty-pile" :class="{ large }">—</div>
    </div>
  </div>
</template>

<style scoped>
.discard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 0.8rem;
  color: #888;
}

.discard-slot {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.discard-slot :deep(.card) {
  border-width: 2px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}

.discard-slot.large :deep(.card) {
  border-width: 3px;
  border-radius: 12px;
}

.empty-pile {
  width: 72px;
  height: 104px;
  border: 2px dashed #444;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
}

.empty-pile.large {
  width: 140px;
  height: 210px;
  border-radius: 12px;
  border-width: 3px;
  font-size: 1.2rem;
}
</style>
