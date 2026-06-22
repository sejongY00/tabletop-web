<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

let tapLock = false

/** 구형 Safari(iOS) 스크롤 영역·300ms 지연 대응: click + touchend 모두 처리 */
function enterOneCard(e?: Event) {
  e?.preventDefault()
  if (tapLock) return
  tapLock = true
  router.push('/onecard/lobby').finally(() => {
    window.setTimeout(() => { tapLock = false }, 400)
  })
}
</script>

<template>
  <main class="home">
    <header class="home-header">
      <h1 class="title">Tabletop</h1>
      <p class="subtitle">보드게임 시뮬레이터</p>
    </header>

    <section class="games">
      <button
        type="button"
        class="game-card"
        @click="enterOneCard"
        @touchend.prevent="enterOneCard"
      >
        <span class="game-icon" aria-hidden="true">🃏</span>
        <span class="game-title">원카드</span>
        <span class="game-desc">멀티 디바이스 원카드 시뮬레이터</span>
      </button>
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 32px;
  padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px));
}

.home-header {
  flex-shrink: 0;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #a29bfe, #6c5ce7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #888;
  margin-top: 8px;
  margin-bottom: 48px;
}

.games {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 480px;
}

/* gap 미지원 Safari 폴백 불필요 — 단일 카드 */

.game-card {
  display: block;
  width: 220px;
  min-height: 44px;
  padding: 32px 24px;
  border-radius: 16px;
  border: 2px solid #333;
  background: #2a2a4a;
  color: #eee;
  cursor: pointer;
  text-align: center;
  font: inherit;
  -webkit-appearance: none;
  appearance: none;
  -webkit-tap-highlight-color: rgba(108, 92, 231, 0.25);
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  transition: border-color 0.15s, background 0.15s, -webkit-transform 0.15s, transform 0.15s;
}

.game-card:hover {
  border-color: #6c5ce7;
}

.game-card:active {
  border-color: #6c5ce7;
  background: #353560;
  -webkit-transform: scale(0.98);
  transform: scale(0.98);
}

.game-icon {
  display: block;
  font-size: 3rem;
  margin-bottom: 12px;
  pointer-events: none;
}

.game-title {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 8px;
  pointer-events: none;
}

.game-desc {
  display: block;
  font-size: 0.85rem;
  color: #888;
  pointer-events: none;
}

@media (orientation: landscape) and (max-height: 520px) {
  .home {
    padding: 16px 20px 20px;
    padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    justify-content: flex-start;
  }

  .title {
    font-size: 1.75rem;
  }

  .subtitle {
    margin-top: 4px;
    margin-bottom: 20px;
    font-size: 0.9rem;
  }

  .game-card {
    width: 220px;
    max-width: 100%;
    padding: 20px 18px;
  }

  .game-icon {
    font-size: 2.2rem;
    margin-bottom: 8px;
  }

  .game-title {
    font-size: 1.1rem;
    margin-bottom: 4px;
  }

  .game-desc {
    font-size: 0.8rem;
  }
}
</style>
