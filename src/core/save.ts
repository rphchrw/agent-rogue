import { type GameState } from './engine'

const STORAGE_KEY = 'agent-rogue'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object'

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

const sanitizeNumber = (value: unknown): number | null => {
  if (typeof value !== 'number') {
    return null
  }

  if (!Number.isFinite(value)) {
    return null
  }

  return value
}

const sanitizeState = (value: unknown): GameState | null => {
  if (!isRecord(value)) {
    return null
  }

  const day = sanitizeNumber(value.day)
  const week = sanitizeNumber(value.week)
  const energy = sanitizeNumber(value.energy)
  const maxEnergy = sanitizeNumber(value.maxEnergy)
  const morale = sanitizeNumber(value.morale)
  const skill = sanitizeNumber(value.skill)
  const money = sanitizeNumber(value.money)

  if (
    day === null ||
    week === null ||
    energy === null ||
    maxEnergy === null ||
    morale === null ||
    skill === null ||
    money === null
  ) {
    return null
  }

  const metaRaw = value.meta
  const meta = isRecord(metaRaw)
    ? {
        upgrades: sanitizeUpgrades(metaRaw.upgrades),
        effects: sanitizeEffects(metaRaw.effects),
      }
    : {
        upgrades: {},
        effects: {},
      }

  const next: GameState = {
    day,
    week,
    energy: Math.max(0, Math.min(energy, maxEnergy)),
    maxEnergy,
    morale: Math.max(0, morale),
    skill: Math.max(0, skill),
    money: Math.max(0, money),
    meta,
  }

  if (typeof value.error === 'string') {
    next.error = value.error
  }

  return next
}

export function saveState(state: GameState): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    const serialised = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, serialised)
  } catch (error) {
    console.error('Failed to save game state', error)
  }
}

export function loadState(): GameState | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    return sanitizeState(parsed)
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
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear saved game', error)
  }
}
