import { evaluateGoals } from './goals'

// --- Action & Outcome Types ---
export type GameActionType = 'TRAIN' | 'WORK' | 'REST';

export type GameAction = { type: GameActionType };

export type LoseReason = 'morale' | 'money';

export type GameOutcome =
  | { status: 'ongoing' }
  | { status: 'won' }
  | { status: 'lost'; loseReason: LoseReason };

// --- Meta / Effects / Counters / Goals ---
export interface GameMeta {
  upgrades: Record<string, number>;
  effects: {
    energyCostDelta?: number;
    restMoraleBonus?: number;
    dailyIncome?: number;
    dailyMorale?: number;
  };
  counters: {
    trainsThisWeek: number;
    daysFullEnergy: number;
    zeroMoneyStreak: number;
    lowMoraleStreak: number;
  };
  goalsCompleted: string[];
}

// --- Unified GameState ---
export interface GameState {
  day: number;
  week: number;
  energy: number;
  maxEnergy: number;
  morale: number;
  skill: number;
  money: number;
  error?: string;
  meta: GameMeta;
}

  week: number
  energy: number
  maxEnergy: number
  morale: number
  skill: number
  money: number
// --- Unified GameState (with goals + upgrades/passives) ---
export interface GameState {
  day: number;
  week: number;
  energy: number;
  maxEnergy: number;
  morale: number;
  skill: number;
  money: number;
  error?: string;
  meta: {
    upgrades: Record<string, number>;
    effects: {
      energyCostDelta?: number;
      restMoraleBonus?: number;
      dailyIncome?: number;
      dailyMorale?: number;
    };
    counters: {
      trainsThisWeek: number;
      daysFullEnergy: number;
      zeroMoneyStreak: number;
      lowMoraleStreak: number;
    };
    goalsCompleted: string[];
  };
}

// Keep this helper if the engine uses it
type ActionEffect = {
  cost: number;
  morale?: number;
  skill?: number;
  money?: number;
  energyGain?: number;
};

}

const ACTION_BASE: Record<
  GameActionType,
  {
    cost: number
    skill?: number
    morale?: number
    money?: number
    energyGain?: number
  }
> = {
  TRAIN: { cost: 3, skill: 2 },
  WORK: { cost: 2, money: 5 },
  REST: { cost: 0, morale: 1, energyGain: 2 },
}

export const GOAL_TARGET = 3

export const LOSS_CONDITIONS = {
  moraleZeroDays: 2,
  moneyZeroDays: 7,
} as const

const clampNonNegative = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

const clampCounter = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}

const clampEffect = (value: number | undefined, allowNegative = false): number | undefined => {
  if (value === undefined) return undefined
  if (!Number.isFinite(value)) return allowNegative ? 0 : undefined
  return allowNegative ? value : Math.max(0, value)
}

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
  const maxEnergy = clampNonNegative(state.maxEnergy)
  const energy = Math.min(maxEnergy, clampNonNegative(state.energy))

  const morale = clampNonNegative(state.morale)
  const skill = clampNonNegative(state.skill)
  const money = clampNonNegative(state.money)

  const counters = {
    trainsThisWeek: clampCounter(state.meta.counters.trainsThisWeek),
    daysFullEnergy: clampCounter(state.meta.counters.daysFullEnergy),
    zeroMoneyStreak: clampCounter(state.meta.counters.zeroMoneyStreak),
    lowMoraleStreak: clampCounter(state.meta.counters.lowMoraleStreak),
  }

  const effects = {
    energyCostDelta: clampEffect(state.meta.effects.energyCostDelta, true),
    restMoraleBonus: clampEffect(state.meta.effects.restMoraleBonus),
    dailyIncome: clampEffect(state.meta.effects.dailyIncome),
    dailyMorale: clampEffect(state.meta.effects.dailyMorale),
  }

  return {
    ...state,
    energy,
    maxEnergy,
    morale,
    skill,
    money,
    meta: {
      ...state.meta,
      effects,
      counters,
      upgrades: { ...state.meta.upgrades },
      goalsCompleted: [...state.meta.goalsCompleted],
    },
  }
}

const resolveTransition = (prev: GameState, candidate: GameState): GameState => {
  const { state: withGoals } = evaluateGoals(prev, candidate)
  return clampState(withGoals)
}

export const getOutcome = (state: GameState): GameOutcome => {
  if (state.meta.goalsCompleted.length >= GOAL_TARGET) {
    return { status: 'won' }
  }

  if (state.meta.counters.lowMoraleStreak >= LOSS_CONDITIONS.moraleZeroDays) {
    return { status: 'lost', loseReason: 'morale' }
  }

  if (state.meta.counters.zeroMoneyStreak >= LOSS_CONDITIONS.moneyZeroDays) {
    return { status: 'lost', loseReason: 'money' }
  }

  return { status: 'ongoing' }
}

export const isGameOver = (state: GameState): boolean => getOutcome(state).status !== 'ongoing'

export const applyAction = (state: GameState, action: GameAction): GameState => {
  if (isGameOver(state)) {
    return state
  }

  const config = ACTION_BASE[action.type]
  if (!config) {
    return state
  }

// Energy cost with passives (delta can be negative; floor at 0)
const effects = state.meta.effects ?? {};
const energyCostDelta = effects.energyCostDelta ?? 0;
const effectiveCost = Math.max(0, (config.cost ?? 0) + energyCostDelta);

// Block if you can't afford it
if (state.energy < effectiveCost) {
  return { ...state, error: 'Not enough energy for that action.' };
}

// REST bonus from passives
const restMoraleBonus = action.type === 'REST' ? (effects.restMoraleBonus ?? 0) : 0;

// Apply action deltas; counters update on TRAIN
let next: GameState = {
  ...state,
  error: undefined,
  energy: state.energy - effectiveCost + (config.energyGain ?? 0),
  morale: state.morale + (config.morale ?? 0) + restMoraleBonus,
  skill: state.skill + (config.skill ?? 0),
  money: state.money + (config.money ?? 0),
  meta: {
    ...state.meta,
    counters: {
      ...state.meta.counters,
      trainsThisWeek:
        action.type === 'TRAIN'
          ? state.meta.counters.trainsThisWeek + 1
          : state.meta.counters.trainsThisWeek,
    },
  },
};

// Clamp to safe ranges
next = clampState(next);
return next;


  return resolveTransition(state, next)
}

export const advanceDay = (state: GameState): GameState => {
  if (isGameOver(state)) {
    return state
  }

  const nextDay = state.day === 7 ? 1 : state.day + 1
  const nextWeek = state.day === 7 ? state.week + 1 : state.week

  const dailyIncome = state.meta.effects.dailyIncome ?? 0
  const dailyMorale = state.meta.effects.dailyMorale ?? 0

  const moneyAfterPassive = state.money + dailyIncome
  const moraleAfterPassive = state.morale + dailyMorale

  const nextCounters = {
    trainsThisWeek: state.day === 7 ? 0 : state.meta.counters.trainsThisWeek,
    daysFullEnergy:
      state.energy >= state.maxEnergy
        ? state.meta.counters.daysFullEnergy + 1
        : state.meta.counters.daysFullEnergy,
    zeroMoneyStreak:
      moneyAfterPassive <= 0
        ? state.meta.counters.zeroMoneyStreak + 1
        : 0,
    lowMoraleStreak:
      moraleAfterPassive <= 0
        ? state.meta.counters.lowMoraleStreak + 1
        : 0,
  }

  const next: GameState = {
    ...state,
    day: nextDay,
    week: nextWeek,
    energy: state.maxEnergy,
    morale: moraleAfterPassive,
    money: moneyAfterPassive,
    meta: {
      ...state.meta,
      counters: nextCounters,
    },
  }

  return resolveTransition(state, next)
}

export type UpgradeId =
  | 'energy-drink-fridge'
  | 'time-management-course'
  | 'coffee-subscription'
  | 'side-hustle'
  | 'ergonomic-chair'
  | 'skill-book'

const UPGRADE_CONFIG: Record<UpgradeId, { cost: number; maxLevel?: number }> = {
  'energy-drink-fridge': { cost: 12, maxLevel: 1 },
  'time-management-course': { cost: 18, maxLevel: 1 },
  'coffee-subscription': { cost: 10, maxLevel: 1 },
  'side-hustle': { cost: 16, maxLevel: 1 },
  'ergonomic-chair': { cost: 14, maxLevel: 1 },
  'skill-book': { cost: 8, maxLevel: 3 },
}

export const applyUpgrade = (state: GameState, id: UpgradeId): GameState => {
  if (isGameOver(state)) {
    return state
  }

  const config = UPGRADE_CONFIG[id]
  if (!config) {
    return state
  }

  const currentLevel = state.meta.upgrades[id] ?? 0
  if (config.maxLevel !== undefined && currentLevel >= config.maxLevel) {
    return state
  }

  if (state.money < config.cost) {
    return state
  }

  const nextEffects = { ...state.meta.effects }
  let nextState: GameState = {
    ...state,
    money: state.money - config.cost,
    meta: {
      ...state.meta,
      upgrades: {
        ...state.meta.upgrades,
        [id]: currentLevel + 1,
      },
      effects: nextEffects,
    },
  }

  switch (id) {
    case 'energy-drink-fridge':
      nextState = {
        ...nextState,
        maxEnergy: nextState.maxEnergy + 2,
      }
      break
    case 'time-management-course':
      nextState = {
        ...nextState,
        meta: {
          ...nextState.meta,
          effects: {
            ...nextState.meta.effects,
            energyCostDelta: -1,
          },
        },
      }
      break
    case 'coffee-subscription':
      nextState = {
        ...nextState,
        meta: {
          ...nextState.meta,
          effects: {
            ...nextState.meta.effects,
            restMoraleBonus: (nextState.meta.effects.restMoraleBonus ?? 0) + 1,
          },
        },
      }
      break
    case 'side-hustle':
      nextState = {
        ...nextState,
        meta: {
          ...nextState.meta,
          effects: {
            ...nextState.meta.effects,
            dailyIncome: (nextState.meta.effects.dailyIncome ?? 0) + 2,
          },
        },
      }
      break
    case 'ergonomic-chair':
      nextState = {
        ...nextState,
        meta: {
          ...nextState.meta,
          effects: {
            ...nextState.meta.effects,
            dailyMorale: (nextState.meta.effects.dailyMorale ?? 0) + 1,
          },
        },
      }
      break
    case 'skill-book':
      nextState = {
        ...nextState,
        skill: nextState.skill + 1,
      }
      break
    default:
      break
  }

  return resolveTransition(state, nextState)
}

export const reconcileState = (prev: GameState, candidate: GameState): GameState =>
  resolveTransition(prev, candidate)
