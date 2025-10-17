import { describe, expect, it } from 'vitest'

import {
  advanceDay,
  applyAction,
  createInitialState,
  type GameState,
} from '../src/core/engine'
import { applyUpgrade } from '../src/core/upgrades'

type StateOverrides = Partial<Omit<GameState, 'meta'>> & {
  meta?: {
    upgrades?: Record<string, number>
    effects?: Partial<GameState['meta']['effects']>
    counters?: Partial<GameState['meta']['counters']>
    goalsCompleted?: string[]
  }
}

const buildState = (overrides: StateOverrides = {}): GameState => {
  const base = createInitialState()
  const { meta: metaOverrides, ...rest } = overrides
  return {
    ...base,
    ...rest,
    meta: {
      upgrades: {
        ...base.meta.upgrades,
        ...(metaOverrides?.upgrades ?? {}),
      },
      effects: {
        ...base.meta.effects,
        ...(metaOverrides?.effects ?? {}),
      },
      counters: {
        ...base.meta.counters,
        ...(metaOverrides?.counters ?? {}),
      },
      goalsCompleted: metaOverrides?.goalsCompleted
        ? [...metaOverrides.goalsCompleted]
        : [...base.meta.goalsCompleted],
    },
  }
}

describe('upgrades', () => {
  it('deducts money, applies upgrades, and enforces max level', () => {
    let state = buildState({ money: 40 })

    state = applyUpgrade(state, 'skillBook')
    expect(state.skill).toBe(1)
    expect(state.money).toBe(30)
    expect(state.meta.upgrades.skillBook).toBe(1)

    state = applyUpgrade(state, 'skillBook')
    state = applyUpgrade(state, 'skillBook')
    expect(state.skill).toBe(3)
    expect(state.meta.upgrades.skillBook).toBe(3)
    expect(state.money).toBe(10)

    const afterMax = applyUpgrade(state, 'skillBook')
    expect(afterMax.meta.upgrades.skillBook).toBe(3)
    expect(afterMax.money).toBe(state.money)
    expect(afterMax.error).toBe('Upgrade already at maximum level.')
  })

  it('feeds passives into advanceDay and rest bonuses', () => {
    let state = buildState({ money: 60 })

    state = applyUpgrade(state, 'sideHustle')
    state = applyUpgrade(state, 'ergonomicChair')
    state = applyUpgrade(state, 'coffeeSubscription')

    const afterDay = advanceDay(state)
    expect(afterDay.money).toBe(state.money + 2)
    expect(afterDay.morale).toBe(state.morale + 1)

    const afterRest = applyAction(afterDay, { type: 'REST' })
    expect(afterRest.morale).toBe(afterDay.morale + 2)
  })

  it('caps energy cost reductions at zero cost actions', () => {
    let state = buildState({ energy: 1, money: 50 })

    state = applyUpgrade(state, 'timeManagementCourse')
    state = applyUpgrade(state, 'timeManagementCourse')
    state = applyUpgrade(state, 'timeManagementCourse')

    const afterWork = applyAction(state, { type: 'WORK' })
    expect(afterWork.energy).toBe(1)
    expect(afterWork.money).toBe(state.money + 5)

    const afterRest = applyAction({ ...afterWork, energy: 0 }, { type: 'REST' })
    expect(afterRest.energy).toBe(afterWork.maxEnergy)
    expect(afterRest.morale).toBeGreaterThanOrEqual(afterWork.morale)
  })
})
