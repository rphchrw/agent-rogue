import { describe, expect, it } from 'vitest'

import { applyAction, type GameState } from '../src/core/engine'
import { applyDailyPassives, applyUpgrade } from '../src/core/upgrades'

const createState = (overrides: Partial<GameState> = {}): GameState => ({
  day: 1,
  week: 1,
  energy: 6,
  maxEnergy: 6,
  morale: 5,
  skill: 0,
  money: 40,
  meta: {
    upgrades: {},
    effects: {},
  },
  ...overrides,
})

describe('applyUpgrade', () => {
  it('deducts money, applies effects, and respects max level', () => {
    let state = createState({ money: 40 })

    state = applyUpgrade(state, 'skillBook')
    expect(state.skill).toBe(1)
    expect(state.money).toBe(30)
    expect(state.meta?.upgrades?.skillBook).toBe(1)

    state = applyUpgrade(state, 'skillBook')
    state = applyUpgrade(state, 'skillBook')
    expect(state.skill).toBe(3)
    expect(state.meta?.upgrades?.skillBook).toBe(3)
    expect(state.money).toBe(10)

    const afterMax = applyUpgrade(state, 'skillBook')
    expect(afterMax.meta?.upgrades?.skillBook).toBe(3)
    expect(afterMax.money).toBe(state.money)
    expect(afterMax.error).toBeDefined()
  })

  it('triggers passive effects on next day and actions', () => {
    let state = createState({ money: 60 })

    state = applyUpgrade(state, 'sideHustle')
    state = applyUpgrade(state, 'ergonomicChair')
    state = applyUpgrade(state, 'coffeeSubscription')

    const postDay = applyDailyPassives({
      ...state,
      energy: state.maxEnergy,
    })

    expect(postDay.money).toBe(state.money + 2)
    expect(postDay.morale).toBe(state.morale + 1)

    const afterRest = applyAction(postDay, 'REST')
    expect(afterRest.morale).toBe(postDay.morale + 2)
  })

  it('never drives stats negative and keeps energy costs floored at zero', () => {
    let state = createState({ energy: 1, money: 50 })

    state = applyUpgrade(state, 'timeManagementCourse')

    const afterWork = applyAction(state, 'WORK')
    expect(afterWork.energy).toBe(0)
    expect(afterWork.money).toBe(state.money + 5)
    expect(afterWork.energy).toBeGreaterThanOrEqual(0)

    const afterRest = applyAction({ ...afterWork, energy: 0 }, 'REST')
    expect(afterRest.energy).toBeGreaterThanOrEqual(0)
    expect(afterRest.morale).toBeGreaterThanOrEqual(0)
  })
})
