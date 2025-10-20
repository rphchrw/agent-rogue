import { type GameState } from './engine'
import {
  createEmptyGoalsState,
  createEmptyMilestonesState,
  sanitizeGoalsState,
  sanitizeMilestonesState,
} from '../systems/goals/types'
import { load as loadSnapshot, save as persistSnapshot, SAVE_KEY } from '../systems/save/serialize'
import { toGameState } from '../systems/save/rehydrate'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object'

const sanitizeNumber = (value: unknown, fallback: number): number => {
  const num = typeof value === 'string' ? Number.parseFloat(value) : Number(value)
  return Number.isFinite(num) ? num : fallback
}

const sanitizeUpgrades = (value: unknown): Record<string, number> => {
  if (!isRecord(value)) {
    return {}
  }

  const upgrades: Record<string, number> = {}
  for (const [key, entry] of Object.entries(value)) {
    const num = Number(entry)
    if (Number.isFinite(num)) {
      upgrades[key] = num
    }
  }

  return upgrades
}

const sanitizeEffects = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) {
    return {}
  }

  return { ...value }
}

const sanitizeMeta = (value: unknown) => {
  const base = {
    upgrades: {},
    effects: {},
    goals: createEmptyGoalsState(),
    milestones: createEmptyMilestonesState(),
  }

  if (!isRecord(value)) {
    return base
  }

  const result: Record<string, unknown> = {
    upgrades: sanitizeUpgrades(value.upgrades),
    effects: sanitizeEffects(value.effects),
    goals: sanitizeGoalsState(value.goals),
    milestones: sanitizeMilestonesState(value.milestones),
  }

  if (Array.isArray((value as any).goalSnapshots)) {
    result.goalSnapshots = [...(value as any).goalSnapshots]
  }

  if (Array.isArray((value as any).milestoneSnapshots)) {
    result.milestoneSnapshots = [...(value as any).milestoneSnapshots]
  }

  if (isRecord((value as any).flags)) {
    result.flags = { ...(value as any).flags }
  }

  if (Array.isArray((value as any).inventory)) {
    result.inventory = [...(value as any).inventory]
  }

  const version = sanitizeNumber((value as any).version, 1)
  if (Number.isFinite(version)) {
    result.version = version
  }

  if (isRecord((value as any).stats)) {
    result.stats = { ...(value as any).stats }
  }

  return result
}

const sanitizeGameState = (value: unknown): GameState | null => {
  if (!isRecord(value)) {
    return null
  }

  const day = sanitizeNumber(value.day, 1)
  const week = sanitizeNumber(value.week, 1)
  const energy = sanitizeNumber(value.energy, 0)
  const maxEnergy = Math.max(1, sanitizeNumber(value.maxEnergy, 1))
  const morale = Math.max(0, sanitizeNumber(value.morale, 0))
  const skill = Math.max(0, sanitizeNumber(value.skill, 0))
  const money = Math.max(0, sanitizeNumber(value.money, 0))

  const meta = sanitizeMeta(value.meta)

  const next: GameState = {
    day: Math.max(1, Math.floor(day)),
    week: Math.max(1, Math.floor(week)),
    energy: Math.max(0, Math.min(energy, maxEnergy)),
    maxEnergy,
    morale,
    skill,
    money,
    meta,
  }

  if (typeof value.error === 'string') {
    next.error = value.error
  }

  return next
}

const createDefaultGameState = (): GameState => ({
  day: 1,
  week: 1,
  energy: 0,
  maxEnergy: 6,
  morale: 0,
  skill: 0,
  money: 0,
  meta: {
    upgrades: {},
    effects: {},
    goals: createEmptyGoalsState(),
    milestones: createEmptyMilestonesState(),
  },
})

export function saveState(state: GameState): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    persistSnapshot(state)
  } catch (error) {
    console.error('Failed to save game state', error)
  }
}

export function loadState(): GameState | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  try {
    const snapshot = loadSnapshot()
    if (!snapshot) {
      return null
    }

    const defaults = createDefaultGameState()
    const hydrated = toGameState(snapshot, defaults)
    return sanitizeGameState(hydrated)
  } catch (error) {
    console.error('Failed to load game state', error)
    return null
  }
}

export function clearSave(): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(SAVE_KEY)
  } catch (error) {
    console.error('Failed to clear saved game', error)
  }
}
