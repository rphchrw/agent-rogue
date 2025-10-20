import { evaluateGoals } from './goals'

export type GameActionType = 'TRAIN' | 'WORK' | 'REST'

export type GameAction = { type: GameActionType }

export type LoseReason = 'morale' | 'money'

export type GameOutcome =
  | { status: 'ongoing' }
  | { status: 'won' }
  | { status: 'lost'; loseReason: LoseReason }

export interface GameMetaEffects {
  energyCostDelta?: number
  restMoraleBonus?: number
  dailyIncome?: number
  dailyMorale?: number
}

export interface GameMetaCounters {
  trainsThisWeek: number
  daysFullEnergy: number
  zeroMoneyStreak: number
  lowMoraleStreak: number
}

export interface GameMeta {
  upgrades: Record<string, number>
  effects: GameMetaEffects
  counters: GameMetaCounters
  goalsCompleted: string[]
}

export interface GameState {
  day: number
  week: number
  energy: number
  maxEnergy: number
  morale: number
  skill: number
  money: number
  error?: string
  meta: GameMeta
}

type ActionEffect = {
  cost: number
  morale?: number
  skill?: number
  money?: number
  energyGain?: number
}

const ACTION_CONFIG: Record<GameActionType, ActionEffect> = {
  TRAIN: { cost: 3, skill: 2 },
  WORK: { cost: 2, money: 5 },
  REST: { cost: 0, morale: 1, energyGain: 2 },
}

const clampNonNegative = (value: number): number => Math.max(0, value)

const cloneMeta = (meta?: GameMeta): GameMeta => ({
  upgrades: { ...(meta?.upgrades ?? {}) },
  effects: { ...(meta?.effects ?? {}) },
  counters: {
    trainsThisWeek: meta?.counters?.trainsThisWeek ?? 0,
    daysFullEnergy: meta?.counters?.daysFullEnergy ?? 0,
    zeroMoneyStreak: meta?.counters?.zeroMoneyStreak ?? 0,
    lowMoraleStreak: meta?.counters?.lowMoraleStreak ?? 0,
  },
  goalsCompleted: [...(meta?.goalsCompleted ?? [])],
})

export const createInitialState = (): GameState => ({
  day: 1,
  week: 1,
  energy: 6,
  maxEnergy: 6,
  morale: 5,
  skill: 0,
  money: 10,
  meta: {
    upgrades: {},
    effects: {},
    counters: {
      trainsThisWeek: 0,
      daysFullEnergy: 0,
      zeroMoneyStreak: 0,
      lowMoraleStreak: 0,
    },
    goalsCompleted: [],
  },
})

export const clampState = (state: GameState): GameState => {
  const meta = cloneMeta(state.meta)

  return {
    ...state,
    energy: Math.min(Math.max(0, state.energy), state.maxEnergy),
    morale: clampNonNegative(state.morale),
    skill: clampNonNegative(state.skill),
    money: clampNonNegative(state.money),
    meta,
    error: undefined,
  }
}

export const applyAction = (state: GameState, action: GameAction): GameState => {
  const config = ACTION_CONFIG[action.type]
  if (!config) {
    return clampState(state)
  }

  const meta = cloneMeta(state.meta)
  const effects = meta.effects
  const baseCost = config.cost
  const effectiveCost = Math.max(0, baseCost + (effects.energyCostDelta ?? 0))

  if (state.energy < effectiveCost) {
    return {
      ...clampState(state),
      error: 'Not enough energy for that action.',
    }
  }

  const restMoraleBonus = action.type === 'REST' ? effects.restMoraleBonus ?? 0 : 0

  const nextState: GameState = {
    ...state,
    energy: state.energy - effectiveCost + (config.energyGain ?? 0),
    morale: state.morale + (config.morale ?? 0) + restMoraleBonus,
    skill: state.skill + (config.skill ?? 0),
    money: state.money + (config.money ?? 0),
    meta: {
      ...meta,
      counters: {
        ...meta.counters,
        trainsThisWeek:
          action.type === 'TRAIN'
            ? meta.counters.trainsThisWeek + 1
            : meta.counters.trainsThisWeek,
      },
    },
    error: undefined,
  }

  return clampState(nextState)
}

export const advanceDay = (state: GameState): GameState => {
  const previous = clampState(state)
  const meta = cloneMeta(previous.meta)

  let nextDay = previous.day + 1
  let nextWeek = previous.week
  let trainsThisWeek = meta.counters.trainsThisWeek

  if (nextDay > 7) {
    nextDay = 1
    nextWeek += 1
    trainsThisWeek = 0
  }

  const wasFullEnergy = previous.energy >= previous.maxEnergy
  const zeroMoney = previous.money <= 0
  const lowMorale = previous.morale <= 0

  const counters: GameMetaCounters = {
    trainsThisWeek,
    daysFullEnergy: wasFullEnergy ? meta.counters.daysFullEnergy + 1 : 0,
    zeroMoneyStreak: zeroMoney ? meta.counters.zeroMoneyStreak + 1 : 0,
    lowMoraleStreak: lowMorale ? meta.counters.lowMoraleStreak + 1 : 0,
  }

  const dailyIncome = meta.effects.dailyIncome ?? 0
  const dailyMorale = meta.effects.dailyMorale ?? 0

  const nextState: GameState = {
    ...previous,
    day: nextDay,
    week: nextWeek,
    energy: previous.maxEnergy,
    morale: previous.morale + dailyMorale,
    money: previous.money + dailyIncome,
    meta: {
      ...meta,
      counters,
    },
    error: undefined,
  }

  const evaluated = evaluateGoals(previous, nextState)
  return clampState(evaluated)
}
