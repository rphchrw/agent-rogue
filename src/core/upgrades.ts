import type { GameState } from './engine'

export type Upgrade = {
  id: string
  name: string
  desc: string
  cost: number
  repeatable?: boolean
  maxLevel?: number
  apply(state: GameState): GameState
}

type MetaShape = Required<NonNullable<GameState['meta']>>

const ensureMeta = (state: GameState): MetaShape => ({
  upgrades: { ...(state.meta?.upgrades ?? {}) },
  effects: { ...(state.meta?.effects ?? {}) },
})

const clampNonNegative = (value: number): number => Math.max(0, value)

export const UPGRADES: Upgrade[] = [
  {
    id: 'energyDrinkFridge',
    name: 'Energy Drink Fridge',
    desc: 'Increase max energy by 2.',
    cost: 12,
    apply(state) {
      const meta = ensureMeta(state)
      const nextMaxEnergy = state.maxEnergy + 2
      const nextEnergy = Math.min(nextMaxEnergy, state.energy + 2)
      return {
        ...state,
        maxEnergy: nextMaxEnergy,
        energy: nextEnergy,
        meta,
      }
    },
  },
  {
    id: 'ergonomicChair',
    name: 'Ergonomic Chair',
    desc: '+1 morale at the start of each day.',
    cost: 15,
    apply(state) {
      const meta = ensureMeta(state)
      const current = meta.effects.ergonomicChair ?? 0
      meta.effects.ergonomicChair = current + 1
      return {
        ...state,
        meta,
      }
    },
  },
  {
    id: 'skillBook',
    name: 'Skill Book',
    desc: '+1 skill immediately. Max 3 purchases.',
    cost: 10,
    repeatable: true,
    maxLevel: 3,
    apply(state) {
      const meta = ensureMeta(state)
      return {
        ...state,
        skill: state.skill + 1,
        meta,
      }
    },
  },
  {
    id: 'timeManagementCourse',
    name: 'Time Management Course',
    desc: 'Actions cost 1 less energy (min 0).',
    cost: 20,
    apply(state) {
      const meta = ensureMeta(state)
      meta.effects.energyCostReduction = Math.min(
        (meta.effects.energyCostReduction ?? 0) + 1,
        3,
      )
      return {
        ...state,
        meta,
      }
    },
  },
  {
    id: 'sideHustle',
    name: 'Side Hustle',
    desc: 'Earn an extra $2 each new day.',
    cost: 18,
    apply(state) {
      const meta = ensureMeta(state)
      const current = meta.effects.sideHustle ?? 0
      meta.effects.sideHustle = current + 2
      return {
        ...state,
        meta,
      }
    },
  },
  {
    id: 'coffeeSubscription',
    name: 'Coffee Subscription',
    desc: '+1 morale when you Rest.',
    cost: 8,
    apply(state) {
      const meta = ensureMeta(state)
      const current = meta.effects.restMoraleBonus ?? 0
      meta.effects.restMoraleBonus = current + 1
      return {
        ...state,
        meta,
      }
    },
  },
]

const getMaxLevel = (upgrade: Upgrade): number => {
  if (upgrade.repeatable) {
    return upgrade.maxLevel ?? Number.POSITIVE_INFINITY
  }
  return upgrade.maxLevel ?? 1
}

export const applyUpgrade = (state: GameState, id: string): GameState => {
  const upgrade = UPGRADES.find(item => item.id === id)
  if (!upgrade) {
    return state
  }

  const currentLevel = state.meta?.upgrades?.[id] ?? 0
  const maxLevel = getMaxLevel(upgrade)

  if (currentLevel >= maxLevel) {
    return {
      ...state,
      error: 'Upgrade already at maximum level.',
    }
  }

  if (state.money < upgrade.cost) {
    return {
      ...state,
      error: 'Not enough money for that upgrade.',
    }
  }

  const baseMeta = ensureMeta(state)
  const baseState: GameState = {
    ...state,
    money: state.money - upgrade.cost,
    meta: baseMeta,
    error: undefined,
  }

  const appliedState = upgrade.apply(baseState)
  const nextMeta = ensureMeta(appliedState)
  nextMeta.upgrades[id] = currentLevel + 1

  return {
    ...appliedState,
    money: clampNonNegative(appliedState.money),
    meta: nextMeta,
    error: undefined,
  }
}

export const applyDailyPassives = (state: GameState): GameState => {
  const meta = ensureMeta(state)
  const sideHustleBonus = meta.effects.sideHustle ?? 0
  const moraleBonus = meta.effects.ergonomicChair ?? 0

  return {
    ...state,
    money: clampNonNegative(state.money + sideHustleBonus),
    morale: clampNonNegative(state.morale + moraleBonus),
    meta,
  }
}
