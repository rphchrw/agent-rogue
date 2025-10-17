export type GameAction = 'TRAIN' | 'WORK' | 'REST'

export type GameStatus = 'ongoing' | 'won' | 'lost'

export type LoseReason = 'morale' | 'money'

export interface GoalCounters {
  trainThisWeek: number
  fullEnergyDays: number
  consecutiveMoraleZeroDays: number
  consecutiveMoneyZeroDays: number
}

export interface GoalLossConfig {
  moraleZeroDays: number
  moneyZeroDays: number
}

export interface GoalMeta {
  completedGoals: string[]
  goalTarget: number
  loss: GoalLossConfig
  counters: GoalCounters
}

export interface GameState {
  day: number
  week: number
  energy: number
  maxEnergy: number
  morale: number
  skill: number
  money: number
  status: GameStatus
  loseReason?: LoseReason
  meta: GoalMeta
  error?: string
}

export const DEFAULT_GOAL_TARGET = 3

export const DEFAULT_LOSS_CONDITIONS: GoalLossConfig = {
  moraleZeroDays: 2,
  moneyZeroDays: 7,
}

const createDefaultCounters = (): GoalCounters => ({
  trainThisWeek: 0,
  fullEnergyDays: 0,
  consecutiveMoraleZeroDays: 0,
  consecutiveMoneyZeroDays: 0,
})

export const createInitialState = (): GameState => ({
  day: 1,
  week: 1,
  energy: 6,
  maxEnergy: 6,
  morale: 5,
  skill: 0,
  money: 10,
  status: 'ongoing',
  meta: {
    completedGoals: [],
    goalTarget: DEFAULT_GOAL_TARGET,
    loss: { ...DEFAULT_LOSS_CONDITIONS },
    counters: createDefaultCounters(),
  },
})

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

  if (state.status !== 'ongoing') {
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

  const nextCounters: GoalCounters =
    action === 'TRAIN'
      ? {
          ...state.meta.counters,
          trainThisWeek: state.meta.counters.trainThisWeek + 1,
        }
      : state.meta.counters

  return {
    ...state,
    energy: nextEnergy,
    morale: nextMorale,
    skill: nextSkill,
    money: nextMoney,
    meta: {
      ...state.meta,
      counters: nextCounters,
    },
    error: undefined,
  }
}

export function advanceDay(state: GameState): GameState {
  if (state.status !== 'ongoing') {
    return state
  }

  let nextDay = state.day + 1
  let nextWeek = state.week
  let nextTrainThisWeek = state.meta.counters.trainThisWeek

  if (nextDay > 7) {
    nextDay = 1
    nextWeek += 1
    nextTrainThisWeek = 0
  }

  const consecutiveMoraleZeroDays =
    state.morale <= 0 ? state.meta.counters.consecutiveMoraleZeroDays + 1 : 0
  const consecutiveMoneyZeroDays =
    state.money <= 0 ? state.meta.counters.consecutiveMoneyZeroDays + 1 : 0
  const fullEnergyDays =
    state.energy >= state.maxEnergy
      ? state.meta.counters.fullEnergyDays + 1
      : state.meta.counters.fullEnergyDays

  return {
    ...state,
    day: nextDay,
    week: nextWeek,
    energy: state.maxEnergy,
    error: undefined,
    meta: {
      ...state.meta,
      counters: {
        ...state.meta.counters,
        trainThisWeek: nextTrainThisWeek,
        fullEnergyDays,
        consecutiveMoraleZeroDays,
        consecutiveMoneyZeroDays,
      },
    },
  }
}

export function checkLoss(state: GameState): GameState {
  if (state.status !== 'ongoing') {
    return state
  }

  const { consecutiveMoraleZeroDays, consecutiveMoneyZeroDays } = state.meta.counters
  const { moraleZeroDays, moneyZeroDays } = state.meta.loss

  if (consecutiveMoraleZeroDays >= moraleZeroDays) {
    return {
      ...state,
      status: 'lost',
      loseReason: 'morale',
    }
  }

  if (consecutiveMoneyZeroDays >= moneyZeroDays) {
    return {
      ...state,
      status: 'lost',
      loseReason: 'money',
    }
  }

  return state
}
