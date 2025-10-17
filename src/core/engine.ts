export type GameAction = 'TRAIN' | 'WORK' | 'REST'

export interface GameState {
  day: number
  week: number
  energy: number
  maxEnergy: number
  morale: number
  skill: number
  money: number
  error?: string
}

type ActionEffect = {
  cost: number
  morale?: number
  skill?: number
  money?: number
  energyGain?: number
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

const ACTIONS: Record<GameAction, ActionEffect> = {
  TRAIN: { cost: 3, skill: 2 },
  WORK: { cost: 2, money: 5 },
  REST: { cost: 0, morale: 1, energyGain: 2 },
}

export function applyAction(state: GameState, action: GameAction): GameState {
  const config = ACTIONS[action]

  if (!config) {
    return state
  }

  if (state.energy < config.cost) {
    return {
      ...state,
      error: 'Not enough energy for that action.',
    }
  }

  const nextEnergy = clamp(
    state.energy - config.cost + (config.energyGain ?? 0),
    0,
    state.maxEnergy,
  )

  const nextMorale = clamp(state.morale + (config.morale ?? 0), 0, Number.POSITIVE_INFINITY)
  const nextSkill = clamp(state.skill + (config.skill ?? 0), 0, Number.POSITIVE_INFINITY)
  const nextMoney = Math.max(0, state.money + (config.money ?? 0))

  return {
    ...state,
    energy: nextEnergy,
    morale: nextMorale,
    skill: nextSkill,
    money: nextMoney,
    error: undefined,
  }
}
