<script setup lang="ts">
defineProps<{
  players: { id: string; name: string; handCount?: number }[]
  selectedId: string | null
  currentTurnId?: string | null
}>()

const emit = defineEmits<{
  select: [playerId: string]
}>()
</script>

<template>
  <div class="draw-buttons">
    <button
      v-for="player in players"
      :key="player.id"
      class="player-btn"
      :class="{
        selected: selectedId === player.id,
        'is-turn': currentTurnId === player.id,
      }"
      @click="emit('select', player.id)"
    >
      <span class="player-name">{{ player.name }}</span>
      <span v-if="player.handCount !== undefined" class="hand-count">
        {{ player.handCount }}장
      </span>
    </button>
  </div>
</template>

<style scoped>
.draw-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-btn {
  padding: 12px 20px;
  border-radius: 10px;
  border: 2px solid #444;
  background: #2a2a4a;
  color: #eee;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-width: 160px;
  transition: border-color 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.player-btn.selected {
  border-color: #6c5ce7;
  background: #3d3560;
}

.player-btn.is-turn {
  border-color: #f1c40f;
}

.player-btn.selected.is-turn {
  border-color: #a29bfe;
  box-shadow: 0 0 0 2px #f1c40f;
}

.player-name {
  font-weight: 600;
}

.hand-count {
  font-size: 0.85rem;
  color: #aaa;
}
</style>
