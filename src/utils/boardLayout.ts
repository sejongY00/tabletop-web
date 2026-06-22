export const MAX_PLAYERS = 4

/** 시계 방향: 아래 → 왼쪽 → 위 → 오른쪽 (보드판 기준) */
export const CORNERS_CLOCKWISE = ['bottom', 'left', 'top', 'right'] as const
export type BoardCorner = (typeof CORNERS_CLOCKWISE)[number]

export type SeatMap = Record<BoardCorner, string | null>

export const CORNER_LABELS: Record<BoardCorner, string> = {
  bottom: '아래',
  left: '왼쪽',
  top: '위',
  right: '오른쪽',
}

const SEAT_KEY = 'tabletop-board-seats'

export function emptySeats(): SeatMap {
  return { bottom: null, left: null, top: null, right: null }
}

export function autoAssignSeats(playerIds: string[], current?: SeatMap): SeatMap {
  const seats = current ? { ...current } : emptySeats()

  for (const corner of CORNERS_CLOCKWISE) {
    const id = seats[corner]
    if (id && !playerIds.includes(id)) {
      seats[corner] = null
    }
  }

  const assigned = new Set(
    CORNERS_CLOCKWISE.map((c) => seats[c]).filter((id): id is string => !!id),
  )
  const unassigned = playerIds.filter((id) => !assigned.has(id))

  for (const id of unassigned) {
    const emptyCorner = CORNERS_CLOCKWISE.find((c) => !seats[c])
    if (!emptyCorner) break
    seats[emptyCorner] = id
  }

  return seats
}

export function loadSeats(): SeatMap | null {
  try {
    const raw = sessionStorage.getItem(SEAT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SeatMap
    return { ...emptySeats(), ...parsed }
  } catch {
    return null
  }
}

export function saveSeats(seats: SeatMap): void {
  sessionStorage.setItem(SEAT_KEY, JSON.stringify(seats))
}

export function clearSeats(): void {
  sessionStorage.removeItem(SEAT_KEY)
}

export function turnOrderFromSeats(seats: SeatMap): string[] {
  return CORNERS_CLOCKWISE
    .map((c) => seats[c])
    .filter((id): id is string => !!id)
}

export function assignedPlayerCount(seats: SeatMap): number {
  return turnOrderFromSeats(seats).length
}

export function playerAtCorner(seats: SeatMap, corner: BoardCorner): string | null {
  return seats[corner]
}

export function cornerForPlayer(seats: SeatMap, playerId: string): BoardCorner | null {
  for (const corner of CORNERS_CLOCKWISE) {
    if (seats[corner] === playerId) return corner
  }
  return null
}

/** 플레이어를 해당 모서리로 옮김(기존 자리 비움). 대상 자리에 있던 플레이어는 미배치로 돌아감. */
export function assignPlayerToCorner(
  seats: SeatMap,
  corner: BoardCorner,
  playerId: string | null,
): SeatMap {
  const next = { ...seats }

  if (playerId === null) {
    next[corner] = null
    return next
  }

  for (const c of CORNERS_CLOCKWISE) {
    if (next[c] === playerId) next[c] = null
  }
  next[corner] = playerId
  return next
}

/** 드롭: 빈 자리면 이동, occupied면 맞바꿈. 미배치에서 드롭 시 기존 자리 플레이어는 미배치. */
export function dropPlayerOnCorner(
  seats: SeatMap,
  targetCorner: BoardCorner,
  playerId: string,
): SeatMap {
  const next = { ...seats }
  const sourceCorner = cornerForPlayer(next, playerId)

  if (sourceCorner === targetCorner) return next

  const occupantId = next[targetCorner]

  if (sourceCorner) {
    if (occupantId) {
      next[sourceCorner] = occupantId
      next[targetCorner] = playerId
    } else {
      next[sourceCorner] = null
      next[targetCorner] = playerId
    }
  } else {
    next[targetCorner] = playerId
  }

  return next
}

export function dropPlayerOnPool(seats: SeatMap, playerId: string): SeatMap {
  const sourceCorner = cornerForPlayer(seats, playerId)
  if (!sourceCorner) return seats
  return { ...seats, [sourceCorner]: null }
}

export function getPlayerById(
  players: { id: string; name: string; handCount?: number }[],
  id: string | null,
) {
  if (!id) return null
  return players.find((p) => p.id === id) ?? null
}
