import { describe, expect, it } from 'vitest'

import { createInitialState, type GameState } from '../src/core/engine'
import { GOAL_TARGET, evaluateGoals, getOutcome } from '../src/core/goals'

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

describe('goals', () => {
  it('adds newly completed goals exactly once', () => {
    const previous = buildState({
      meta: {
        counters: { trainsThisWeek: 2 },
      },
    })

    const next = buildState({
      meta: {
        counters: { trainsThisWeek: 3 },
      },
    })

    const evaluated = evaluateGoals(previous, next)
    expect(evaluated.meta.goalsCompleted).toContain('consistent-training')

    const again = evaluateGoals(next, evaluated)
    expect(again.meta.goalsCompleted.filter(id => id === 'consistent-training')).toHaveLength(1)
  })

  it('reports a win when enough goals are complete', () => {
    const state = buildState({
      meta: {
        goalsCompleted: ['nest-egg', 'consistent-training', 'well-rested'].slice(
          0,
          GOAL_TARGET,
        ),
      },
    })

    const outcome = getOutcome(state)
    expect(outcome.status).toBe('won')
  })

  it('reports morale-based loss streaks', () => {
    const state = buildState({
      meta: {
        counters: { lowMoraleStreak: 2 },
      },
    })

    const outcome = getOutcome(state)
    expect(outcome).toEqual({ status: 'lost', loseReason: 'morale' })
  })

  it('reports money-based loss streaks', () => {
    const state = buildState({
      meta: {
        counters: { zeroMoneyStreak: 7 },
      },
    })

    const outcome = getOutcome(state)
    expect(outcome).toEqual({ status: 'lost', loseReason: 'money' })
  })
})
