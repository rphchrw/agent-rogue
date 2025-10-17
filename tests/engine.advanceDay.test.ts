import { describe, expect, it } from 'vitest'

import { advanceDay, createInitialState, type GameState } from '../src/core/engine'

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

describe('engine advanceDay', () => {
  it('applies passive effects and updates streak counters', () => {
    const state = buildState({
      day: 3,
      energy: 6,
      morale: 0,
      money: 0,
      meta: {
        counters: {
          trainsThisWeek: 1,
          daysFullEnergy: 2,
          zeroMoneyStreak: 1,
          lowMoraleStreak: 1,
        },
        effects: {
          dailyIncome: 4,
          dailyMorale: 2,
        },
      },
    })

    const next = advanceDay(state)

    expect(next.day).toBe(4)
    expect(next.energy).toBe(next.maxEnergy)
    expect(next.money).toBe(4)
    expect(next.morale).toBe(2)
    expect(next.meta.counters.zeroMoneyStreak).toBe(2)
    expect(next.meta.counters.lowMoraleStreak).toBe(2)
    expect(next.meta.counters.daysFullEnergy).toBe(3)
    expect(next.meta.goalsCompleted).toContain('well-rested')
  })

  it('rolls into a new week and resets weekly counters', () => {
    const state = buildState({
      day: 7,
      week: 2,
      energy: 3,
      morale: 4,
      money: 10,
      meta: {
        counters: {
          trainsThisWeek: 4,
          daysFullEnergy: 1,
          zeroMoneyStreak: 0,
          lowMoraleStreak: 0,
        },
        goalsCompleted: ['nest-egg'],
      },
    })

    const next = advanceDay(state)

    expect(next.day).toBe(1)
    expect(next.week).toBe(3)
    expect(next.meta.counters.trainsThisWeek).toBe(0)
    expect(next.meta.counters.daysFullEnergy).toBe(0)
    expect(next.meta.counters.zeroMoneyStreak).toBe(0)
    expect(next.meta.goalsCompleted).toEqual(['nest-egg'])
  })
})
