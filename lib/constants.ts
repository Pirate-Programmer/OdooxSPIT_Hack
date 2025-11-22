// Constants for MoveType and MoveStatus (since SQLite doesn't support enums)
export const MoveType = {
  RECEIPT: 'RECEIPT',
  DELIVERY: 'DELIVERY',
  ADJUSTMENT: 'ADJUSTMENT',
} as const

export const MoveStatus = {
  DRAFT: 'DRAFT',
  WAITING: 'WAITING',
  READY: 'READY',
  DONE: 'DONE',
} as const

export type MoveType = typeof MoveType[keyof typeof MoveType]
export type MoveStatus = typeof MoveStatus[keyof typeof MoveStatus]

