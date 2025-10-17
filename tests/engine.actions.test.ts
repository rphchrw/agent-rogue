import { describe, expect, it } from 'vitest'

import { applyAction, createInitialState, type GameState } from '../src/core/engine'

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

describe('engine applyAction', () => {
  it('honours energy cost modifiers from passives', () => {
    const state = buildState({
      energy: 1,
      meta: {
        effects: { energyCostDelta: -3 },
      },
    })

    const result = applyAction(state, { type: 'WORK' })

    expect(result.energy).toBe(1)
    expect(result.money).toBe(state.money + 5)
    expect(result.error).toBeUndefined()
  })

  it('adds rest morale bonus from effects', () => {
    const state = buildState({
      morale: 3,
      meta: {
        effects: { restMoraleBonus: 2 },
      },
    })

    const result = applyAction(state, { type: 'REST' })

    expect(result.morale).toBe(6)
    expect(result.energy).toBe(state.maxEnergy)
  })

  it('increments weekly training counter on TRAIN', () => {
    const state = buildState({
      meta: {
        counters: { trainsThisWeek: 2 },
      },
    })

    const result = applyAction(state, { type: 'TRAIN' })

    expect(result.meta.counters.trainsThisWeek).toBe(3)
    expect(result.skill).toBe(state.skill + 2)
    expect(result.error).toBeUndefined()
  })
})
