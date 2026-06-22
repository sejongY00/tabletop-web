<script setup lang="ts"></script>

<template>
  <router-view />
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a2e;
  color: #eee;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

#app {
  min-height: 100vh;
  min-height: 100dvh;
  user-select: none;
  -webkit-user-select: none;
}

/* 입력·복사가 필요한 곳만 텍스트 선택 허용 */
input,
textarea,
select,
[contenteditable='true'],
.selectable {
  user-select: text;
  -webkit-user-select: text;
}

img,
svg {
  -webkit-user-drag: none;
  user-drag: none;
}

button,
a,
[role='button'] {
  touch-action: manipulation;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  font: inherit;
  color: inherit;
}
</style>
