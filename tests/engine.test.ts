import { describe, expect, it } from 'vitest'

import {
  advanceDay,
  applyAction,
  createInitialState,
  getOutcome,
  LOSS_CONDITIONS,
} from '../src/core/engine'
import type { GameState } from '../src/core/engine'

const cloneState = (state: GameState, overrides: Partial<GameState> = {}): GameState => {
  const next: GameState = {
    ...state,
    ...overrides,
    meta: {
      ...state.meta,
      ...(overrides.meta ?? {}),
      upgrades: { ...state.meta.upgrades, ...(overrides.meta?.upgrades ?? {}) },
      effects: { ...state.meta.effects, ...(overrides.meta?.effects ?? {}) },
      counters: { ...state.meta.counters, ...(overrides.meta?.counters ?? {}) },
      goalsCompleted: overrides.meta?.goalsCompleted
        ? [...overrides.meta.goalsCompleted]
        : [...state.meta.goalsCompleted],
    },
  }

  return next
}

describe('engine rules', () => {
  it('spends energy and increases skill when training', () => {
    const start = createInitialState()

    const result = applyAction(start, { type: 'TRAIN' })

    expect(result.energy).toBe(start.energy - 3)
    expect(result.skill).toBe(start.skill + 2)
  })

  it('prevents unaffordable actions and keeps state intact', () => {
    const start = cloneState(createInitialState(), { energy: 1 })

    const result = applyAction(start, { type: 'WORK' })

    expect(result.energy).toBe(start.energy)
    expect(result.money).toBe(start.money)
  })

  it('respects energy cost modifiers and floors at zero', () => {
    const start = cloneState(createInitialState(), {
      energy: 1,
      meta: {
        effects: {
          energyCostDelta: -5,
        },
      },
    })

    const result = applyAction(start, { type: 'WORK' })

    expect(result.energy).toBe(start.energy)
    expect(result.money).toBe(start.money + 5)
  })

  it('adds rest morale bonuses from effects', () => {
    const start = cloneState(createInitialState(), {
      energy: 2,
      morale: 3,
      meta: {
        effects: {
          restMoraleBonus: 2,
        },
      },
    })

    const result = applyAction(start, { type: 'REST' })

    expect(result.morale).toBe(start.morale + 1 + 2)
    expect(result.energy).toBeGreaterThanOrEqual(start.energy)
  })

  it('applies passives and weekly resets on advanceDay', () => {
    const base = createInitialState()
    const start = cloneState(base, {
      day: 7,
      week: 1,
      energy: base.maxEnergy,
      morale: 4,
      money: 6,
      meta: {
        counters: {
          trainsThisWeek: 3,
          daysFullEnergy: 1,
          zeroMoneyStreak: 0,
          lowMoraleStreak: 0,
        },
        effects: {
          dailyIncome: 2,
          dailyMorale: 1,
        },
      },
    })

    const result = advanceDay(start)

    expect(result.day).toBe(1)
    expect(result.week).toBe(2)
    expect(result.energy).toBe(result.maxEnergy)
    expect(result.money).toBe(start.money + 2)
    expect(result.morale).toBe(start.morale + 1)
    expect(result.meta.counters.trainsThisWeek).toBe(0)
    expect(result.meta.counters.daysFullEnergy).toBe(start.meta.counters.daysFullEnergy + 1)
  })

  it('records loss streaks leading to defeat', () => {
    const base = createInitialState()
    const start = cloneState(base, {
      morale: 0,
      money: 0,
      meta: {
        counters: {
          zeroMoneyStreak: LOSS_CONDITIONS.moneyZeroDays - 1,
          lowMoraleStreak: LOSS_CONDITIONS.moraleZeroDays - 1,
        },
      },
    })

    const result = advanceDay(start)
    const outcome = getOutcome(result)

    expect(outcome.status).toBe('lost')
    expect(outcome.loseReason === 'morale' || outcome.loseReason === 'money').toBe(true)
  })
})
