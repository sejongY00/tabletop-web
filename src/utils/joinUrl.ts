/** 로비 참가 URL (?room=방코드) */
export const ROOM_QUERY_KEY = 'room'

export function buildLobbyJoinUrl(roomCode: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/')
  const path = `${base}onecard/lobby`.replace(/\/+/g, '/')
  const url = new URL(path, window.location.origin)
  url.searchParams.set(ROOM_QUERY_KEY, roomCode.trim().toUpperCase())
  return url.toString()
}

export function parseRoomCodeFromQuery(
  query: Record<string, unknown>,
): string | null {
  const raw = query[ROOM_QUERY_KEY]
  const value = Array.isArray(raw) ? raw[0] : raw
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return code.length === 6 ? code : null
}
