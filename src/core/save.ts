import { createInitialState, type GameState } from './engine'

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

const defaultCounters = () => ({
  trainsThisWeek: 0,
  daysFullEnergy: 0,
  zeroMoneyStreak: 0,
  lowMoraleStreak: 0,
})

const sanitizeEffects = (
  value: unknown,
): GameState['meta']['effects'] => {
  if (!isRecord(value)) {
    return {}
  }

  const effects: GameState['meta']['effects'] = {}

  const maybeNumber = (entry: unknown): number | null =>
    typeof entry === 'number' && Number.isFinite(entry) ? entry : null

  const energyCostDelta = maybeNumber(value.energyCostDelta)
  if (energyCostDelta !== null) {
    effects.energyCostDelta = energyCostDelta
  }

  const restMoraleBonus = maybeNumber(value.restMoraleBonus)
  if (restMoraleBonus !== null && restMoraleBonus >= 0) {
    effects.restMoraleBonus = restMoraleBonus
  }

  const dailyIncome = maybeNumber(value.dailyIncome)
  if (dailyIncome !== null && dailyIncome >= 0) {
    effects.dailyIncome = dailyIncome
  }

  const dailyMorale = maybeNumber(value.dailyMorale)
  if (dailyMorale !== null && dailyMorale >= 0) {
    effects.dailyMorale = dailyMorale
  }

  return effects
}

const sanitizeCounters = (
  value: unknown,
): GameState['meta']['counters'] => {
  const base = defaultCounters()
  if (!isRecord(value)) {
    return base
  }

  const read = (key: keyof GameState['meta']['counters']) => {
    const entry = value[key]
    if (typeof entry === 'number' && Number.isFinite(entry) && entry >= 0) {
      return entry
    }
    return base[key]
  }

  return {
    trainsThisWeek: read('trainsThisWeek'),
    daysFullEnergy: read('daysFullEnergy'),
    zeroMoneyStreak: read('zeroMoneyStreak'),
    lowMoraleStreak: read('lowMoraleStreak'),
  }
}

const sanitizeGoals = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  for (const entry of value) {
    if (typeof entry === 'string') {
      seen.add(entry)
    }
  }

  return Array.from(seen)
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

  const initialMeta = createInitialState().meta
  const metaRaw = value.meta
  const meta = isRecord(metaRaw)
    ? {
        upgrades: sanitizeUpgrades(metaRaw.upgrades),
        effects: sanitizeEffects(metaRaw.effects),
        counters: sanitizeCounters(metaRaw.counters),
        goalsCompleted: sanitizeGoals(metaRaw.goalsCompleted),
      }
    : {
        upgrades: initialMeta.upgrades,
        effects: initialMeta.effects,
        counters: initialMeta.counters,
        goalsCompleted: initialMeta.goalsCompleted,
      }

  const next: GameState = {
    day,
    week,
    energy: Math.max(0, Math.min(energy, maxEnergy)),
    maxEnergy,
    morale: Math.max(0, morale),
    skill: Math.max(0, skill),
    money: Math.max(0, money),
    meta: {
      upgrades: { ...meta.upgrades },
      effects: { ...meta.effects },
      counters: { ...meta.counters },
      goalsCompleted: [...meta.goalsCompleted],
    },
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
