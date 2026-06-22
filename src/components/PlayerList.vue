<script setup lang="ts">
defineProps<{
  players: { id: string; name: string; handCount?: number }[]
  currentTurnId?: string | null
}>()
</script>

<template>
  <ul class="player-list">
    <li
      v-for="player in players"
      :key="player.id"
      class="player-item"
      :class="{ active: currentTurnId === player.id }"
    >
      <span class="name">{{ player.name }}</span>
      <span v-if="player.handCount !== undefined" class="count">{{ player.handCount }}장</span>
      <span v-if="currentTurnId === player.id" class="turn-badge">턴</span>
    </li>
  </ul>
</template>

<style scoped>
.player-list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #2a2a4a;
  border-radius: 8px;
  border: 2px solid transparent;
  font-size: 0.9rem;
}

.player-item.active {
  border-color: #f1c40f;
}

.name {
  font-weight: 600;
}

.count {
  color: #aaa;
  font-size: 0.85rem;
}

.turn-badge {
  background: #f1c40f;
  color: #1a1a2e;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
