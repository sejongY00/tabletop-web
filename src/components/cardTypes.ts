export type CardViewSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/** 보드판 중앙 덱·버린 더미 공통 카드 크기 */
export const PILE_CARD = {
  md: { width: 72, height: 104, stackWidth: 80, stackHeight: 110 },
  lg: { width: 140, height: 210, stackWidth: 152, stackHeight: 224 },
} as const
