import { createEmptyGoalsState, createEmptyMilestonesState } from '../goals/types'
import type {
  SaveStateGoal,
  SaveStateInventoryEntry,
  SaveStateV1,
} from './types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toNumber = (value: unknown, fallback: number): number => {
  const num = typeof value === 'string' ? Number.parseFloat(value) : Number(value)
  return Number.isFinite(num) ? num : fallback
}

const normalizeNumberRecord = (value: unknown): Record<string, number> => {
  if (!isRecord(value)) {
    return {}
  }

  const result: Record<string, number> = {}
  for (const [key, entry] of Object.entries(value)) {
    const num = Number(entry)
    if (Number.isFinite(num)) {
      result[key] = num
    }
  }

  return result
}

const normalizeInventory = (value: unknown): SaveStateInventoryEntry[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const entries: SaveStateInventoryEntry[] = []
  for (const item of value) {
    if (!isRecord(item)) {
      continue
    }

    const id = typeof item.id === 'string' ? item.id : typeof item.name === 'string' ? item.name : null
    if (!id) {
      continue
    }

    const qtySource =
      'qty' in item
        ? item.qty
        : 'quantity' in item
          ? item.quantity
          : 'count' in item
            ? item.count
            : 0
    const qty = toNumber(qtySource, 0)
    entries.push({ id, qty })
  }

  entries.sort((a, b) => a.id.localeCompare(b.id))

  return entries
}

const normalizeFlags = (value: unknown): Record<string, boolean> => {
  if (!isRecord(value)) {
    return {}
  }

  const result: Record<string, boolean> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'boolean') {
      result[key] = entry
    }
  }

  return result
}

const mergeGoal = (
  collection: Map<string, SaveStateGoal>,
  goal: unknown,
  doneFallback: boolean,
): void => {
  if (!isRecord(goal)) {
    return
  }

  const id = typeof goal.id === 'string' ? goal.id : null
  if (!id) {
    return
  }

  const existing = collection.get(id)
  const progress = toNumber(goal.progress, existing?.progress ?? 0)
  const done =
    typeof goal.done === 'boolean'
      ? goal.done
      : typeof goal.completed === 'boolean'
        ? goal.completed
        : doneFallback

  collection.set(id, {
    id,
    progress,
    done,
  })
}

const normalizeGoals = (value: unknown): SaveStateGoal[] => {
  const goals = new Map<string, SaveStateGoal>()

  if (Array.isArray(value)) {
    for (const entry of value) {
      mergeGoal(goals, entry, Boolean((entry as SaveStateGoal)?.done))
    }
  } else if (isRecord(value)) {
    if (Array.isArray(value.active)) {
      for (const entry of value.active) {
        mergeGoal(goals, entry, false)
      }
    }

    if (Array.isArray(value.completed)) {
      for (const entry of value.completed) {
        mergeGoal(goals, entry, true)
      }
    }
  }

  const result = Array.from(goals.values())
  result.sort((a, b) => a.id.localeCompare(b.id))
  return result
}

const normalizeMilestones = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    const ids = value.filter((entry): entry is string => typeof entry === 'string')
    return Array.from(new Set(ids)).sort()
  }

  if (!isRecord(value)) {
    return []
  }

  const { entries } = value as { entries?: unknown }
  if (!Array.isArray(entries)) {
    return []
  }

  const unlocked: string[] = []
  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue
    }
    if (!entry.unlocked) {
      continue
    }

    const id = typeof entry.id === 'string' ? entry.id : null
    if (id) {
      unlocked.push(id)
    }
  }

  return Array.from(new Set(unlocked)).sort()
}

export const SAVE_KEY = 'agent-rogue:save:v1'

export const VOLATILE_KEYS = new Set(['lastSavedAt', 'rngState', '__meta', 'temp'])

export const stripVolatile = <T>(obj: T): T => {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const clone: any = Array.isArray(obj) ? [...(obj as any[])] : { ...(obj as Record<string, unknown>) }
  for (const key of Object.keys(clone)) {
    if (VOLATILE_KEYS.has(key)) {
      delete clone[key]
    }
  }

  return clone
}

export const extractSave = (state: any): SaveStateV1 => {
  const source = state ?? {}
  const meta = isRecord(source.meta) ? source.meta : {}

  const stats: Record<string, number> = {
    ...normalizeNumberRecord(source.stats),
    ...normalizeNumberRecord(meta.stats),
  }

  const ensureStat = (key: string, value: unknown, fallback: number) => {
    stats[key] = toNumber(value, key in stats ? stats[key] : fallback)
  }

  ensureStat('maxEnergy', source.maxEnergy, 0)
  ensureStat('morale', source.morale, 0)
  ensureStat('skill', source.skill, 0)
  ensureStat('money', source.money, 0)

  if (isRecord(meta.upgrades)) {
    for (const [key, value] of Object.entries(meta.upgrades)) {
      stats[`meta.upgrades.${key}`] = toNumber(value, 0)
    }
  }

  if (isRecord(meta.effects)) {
    for (const [key, value] of Object.entries(meta.effects)) {
      if (typeof value === 'number') {
        stats[`meta.effects.${key}`] = toNumber(value, 0)
      }
    }
  }

  const inventory: SaveStateInventoryEntry[] = [
    ...normalizeInventory(source.inventory),
    ...normalizeInventory(meta.inventory),
  ]

  const inventoryMap = new Map<string, number>()
  for (const entry of inventory) {
    const existing = inventoryMap.get(entry.id) ?? 0
    inventoryMap.set(entry.id, existing + entry.qty)
  }

  const mergedInventory = Array.from(inventoryMap.entries())
    .map(([id, qty]) => ({ id, qty }))
    .sort((a, b) => a.id.localeCompare(b.id))

  const flags = {
    ...normalizeFlags(source.flags),
    ...normalizeFlags(meta.flags),
  }

  const goals = normalizeGoals(meta.goals ?? source.goals ?? createEmptyGoalsState())
  const milestones = normalizeMilestones(meta.milestones ?? source.milestones ?? createEmptyMilestonesState())

  return {
    version: 1,
    day: toNumber(source.day, 1),
    week: toNumber(source.week, 1),
    energy: toNumber(source.energy, 0),
    stats,
    inventory: mergedInventory,
    flags,
    goals,
    milestones,
  }
}

const reviveNumeric = (key: string, value: unknown): unknown => {
  switch (key) {
    case 'day':
    case 'week':
    case 'energy':
    case 'progress':
    case 'qty':
      return toNumber(value, 0)
    default:
      return value
  }
}

export const save = (state: any): void => {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    const serialisable = extractSave(stripVolatile(state))
    localStorage.setItem(SAVE_KEY, JSON.stringify(serialisable))
  } catch (error) {
    console.error('Failed to persist save state', error)
  }
}

export const load = (): SaveStateV1 | null => {
  if (typeof localStorage === 'undefined') {
    return null
  }

  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw, reviveNumeric)
    return extractSave(parsed)
  } catch (error) {
    console.error('Failed to load save state', error)
    return null
  }
}
