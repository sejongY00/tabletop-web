<script setup lang="ts">
import { computed } from "vue";
import type { Card, CardColor } from "@/games/onecard/types";
import type { CardViewSize } from "@/components/cardTypes";
import {
  COLOR_STYLES,
  getCardDisplayColor,
  getCardLabel,
} from "@/games/onecard/cardDisplay";

const props = withDefaults(
  defineProps<{
    card: Card;
    activeColor?: CardColor | null;
    size?: CardViewSize;
    faceDown?: boolean;
    selected?: boolean;
    disabled?: boolean;
    playable?: boolean;
    dimensions?: { width: number; height: number };
  }>(),
  {
    activeColor: null,
    size: "md",
    faceDown: false,
    selected: false,
    disabled: false,
    playable: true,
  },
);

const displayColor = computed(() =>
  getCardDisplayColor(props.card, props.activeColor),
);
const style = computed(() => COLOR_STYLES[displayColor.value]);
const label = computed(() => getCardLabel(props.card.value));

const dimensionStyle = computed(() => {
  if (!props.dimensions) return undefined;
  return {
    "--card-w": `${props.dimensions.width}px`,
    "--card-h": `${props.dimensions.height}px`,
  };
});
</script>

<template>
  <div
    class="card"
    :class="[
      size,
      {
        selected,
        disabled,
        unplayable: !playable && !faceDown,
        'face-down': faceDown,
        fluid: !!dimensions,
      },
    ]"
    :style="[
      faceDown
        ? undefined
        : { '--card-color': style.bg, '--card-text': style.text },
      dimensionStyle,
    ]"
  >
    <template v-if="faceDown">
      <div class="card-back">
        <div class="back-pattern" />
      </div>
    </template>
    <template v-else>
      <div class="card-inner">
        <div class="corner top-left">
          <span class="corner-value">{{ label }}</span>
        </div>
        <div class="center">
          <div class="center-oval" />
          <span class="center-value">{{ label }}</span>
        </div>
        <div class="corner bottom-right">
          <span class="corner-value">{{ label }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card {
  --card-w: 72px;
  --card-h: 108px;
  width: var(--card-w);
  height: var(--card-h);
  border-radius: 10px;
  background: #faf8f5;
  border: 2px solid #d4cfc7;
  box-shadow:
    0 1px 0 #fff inset,
    0 4px 12px rgba(0, 0, 0, 0.35),
    0 1px 3px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  user-select: none;
  position: relative;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;
}

.card.sm {
  --card-w: 52px;
  --card-h: 78px;
}

.card.lg {
  --card-w: 100px;
  --card-h: 150px;
}

.card.xl {
  --card-w: 120px;
  --card-h: 176px;
}

.card.2xl {
  --card-w: 140px;
  --card-h: 210px;
  border-radius: 12px;
}

.card.fluid {
  width: var(--card-w);
  height: var(--card-h);
}

.card.fluid .center-value {
  font-size: calc(var(--card-h) * 0.15);
}

.card.fluid .top-left,
.card.fluid .bottom-right {
  font-size: calc(var(--card-h) * 0.08);
}

.card.selected {
  box-shadow:
    0 0 0 3px #f1c40f,
    0 8px 24px rgba(0, 0, 0, 0.45);
  z-index: 50;
}

.card.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.card.unplayable:not(.disabled) {
  opacity: 0.55;
}

.card.face-down {
  cursor: default;
  border-color: #1a3a5c;
  background: #1a3a5c;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--card-text);
  font-weight: 800;
  line-height: 1;
}

.top-left {
  top: 6px;
  left: 7px;
  font-size: 0.85rem;
}

.bottom-right {
  bottom: 6px;
  right: 7px;
  transform: rotate(180deg);
  font-size: 0.85rem;
}

.card.sm .top-left,
.card.sm .bottom-right {
  font-size: 0.65rem;
}

.card.lg .top-left,
.card.lg .bottom-right {
  font-size: 1.1rem;
}

.center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-oval {
  width: 55%;
  height: 42%;
  border-radius: 50%;
  background: var(--card-color);
  opacity: 0.92;
}

.center-value {
  position: absolute;
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--card-text);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.card.sm .center-value {
  font-size: 1.1rem;
}

.card.lg .center-value {
  font-size: 2.2rem;
}

.card.xl .top-left,
.card.xl .bottom-right {
  font-size: 1.2rem;
}

.card.xl .center-value {
  font-size: 2.6rem;
}

.card.2xl .top-left,
.card.2xl .bottom-right {
  font-size: 1.35rem;
}

.card.2xl .center-value {
  font-size: 3rem;
}

.corner-value {
  background: var(--card-color);
  padding: 2px 5px;
  border-radius: 4px;
  min-width: 1.2em;
  text-align: center;
}

.card-back {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: linear-gradient(135deg, #1a3a5c 0%, #0d2137 50%, #1a3a5c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.back-pattern {
  width: 80%;
  height: 85%;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(255, 255, 255, 0.04) 4px,
    rgba(255, 255, 255, 0.04) 8px
  );
}
</style>
