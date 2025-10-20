export type SaveStateGoal = {
  id: string
  progress: number
  done: boolean
}

export type SaveStateInventoryEntry = {
  id: string
  qty: number
}

export type SaveStateV1 = {
  version: 1
  day: number
  week: number
  energy: number
  stats: Record<string, number>
  inventory: SaveStateInventoryEntry[]
  flags: Record<string, boolean>
  goals: SaveStateGoal[]
  milestones: string[]
}
