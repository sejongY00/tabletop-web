import type { SessionInfo } from '@/games/onecard/types'

const SESSION_KEY = 'tabletop-session'
const PLAYER_NAME_KEY = 'tabletop-player-name'

export function saveSession(info: SessionInfo): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(info))
}

export function loadSession(): SessionInfo | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionInfo
  } catch {
    return null
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function loadSavedPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function savePlayerName(name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  try {
    localStorage.setItem(PLAYER_NAME_KEY, trimmed)
  } catch {
    // private browsing 등
  }
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function generatePlayerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // HTTP(LAN IP) 등 비보안 컨텍스트에서는 randomUUID 미지원
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
