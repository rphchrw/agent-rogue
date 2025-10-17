import { describe, expect, it } from 'vitest'

import { applyAction, type GameState } from '../src/core/engine'

const createState = (overrides: Partial<GameState> = {}): GameState => ({
  day: 1,
  week: 1,
  energy: 6,
  maxEnergy: 6,
  morale: 5,
  skill: 0,
  money: 10,
  ...overrides,
})

describe('applyAction', () => {
  it('spends energy and increases skill when training', () => {
    const start = createState()

    const result = applyAction(start, 'TRAIN')

    expect(result.energy).toBe(start.energy - 3)
    expect(result.skill).toBe(start.skill + 2)
    expect(result.error).toBeUndefined()
  })

  it('prevents unaffordable actions and keeps state intact', () => {
    const start = createState({ energy: 1 })

    const result = applyAction(start, 'WORK')

    expect(result.energy).toBe(start.energy)
    expect(result.money).toBe(start.money)
    expect(result.error).toBeDefined()
  })

  it('never lets stats drop below zero', () => {
    const start = createState({ energy: 0 })

    const result = applyAction(start, 'TRAIN')

    expect(result.energy).toBeGreaterThanOrEqual(0)
    expect(result.morale).toBeGreaterThanOrEqual(0)
    expect(result.skill).toBeGreaterThanOrEqual(0)
    expect(result.money).toBeGreaterThanOrEqual(0)
  })

  it('caps energy at the maximum when resting', () => {
    const start = createState({ energy: 5 })

    const result = applyAction(start, 'REST')

    expect(result.energy).toBe(start.maxEnergy)
  })
})
