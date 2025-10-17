import { describe, expect, it } from 'vitest'

import { pickEvent, EVENTS } from '../src/core/events'
import { advanceDay, createInitialState, reconcileState } from '../src/core/engine'
import type { GameState } from '../src/core/engine'
import { next, seedRng, type RngState } from '../src/core/rng'

const baseState: GameState = createInitialState()

describe('events', () => {
  it('pickEvent respects weight ordering', () => {
    const state: GameState = { ...baseState, day: 3, week: 2 }
    const eligible = EVENTS.filter(event => {
      if (event.minDay !== undefined && state.day < event.minDay) {
        return false
      }
      if (event.minWeek !== undefined && state.week < event.minWeek) {
        return false
      }
      return true
    })

    const totalWeight = eligible.reduce((sum, event) => sum + event.weight, 0)

    const first = pickEvent(state, () => 0)
    expect(first?.id).toBe(eligible[0]?.id)

    const boundary = (eligible[0]?.weight ?? 0) / totalWeight + 0.0001
    const second = pickEvent(state, () => boundary)
    expect(second?.id).toBe(eligible[1]?.id)
  })

  it('minDay and minWeek gates apply to early days', () => {
    const state: GameState = { ...baseState, day: 1, week: 1 }
    const earlyEvent = pickEvent(state, () => 0)
    expect(earlyEvent?.id).toBe('coffee-break')
    expect(earlyEvent?.minDay).toBeUndefined()
    expect(earlyEvent?.minWeek).toBeUndefined()
  })

  it('choices keep stats non-negative', () => {
    const event = EVENTS.find(e => e.id === 'unexpected-bill')
    expect(event).toBeTruthy()

    const choice = event?.choices.find(c => c.id === 'pay-now')
    expect(choice).toBeTruthy()

    const starting: GameState = { ...baseState, energy: 0, money: 1, morale: 0 }
    const result = choice!.apply(starting)

    expect(result.money).toBe(0)
    expect(result.morale).toBeGreaterThanOrEqual(0)
    expect(result.energy).toBeGreaterThanOrEqual(0)
  })

  it('deterministic sequence for fixed seed over seven days', () => {
    const simulate = (seed: number) => {
      const rngState: RngState = { seed: 0 }
      seedRng(rngState, seed)
      const rng = () => next(rngState)

      let state: GameState = { ...baseState }
      const events: string[] = []

      for (let i = 0; i < 7; i += 1) {
        state = advanceDay(state)

        if (state.day !== 1) {
          const roll = rng()
          if (roll < 0.35) {
            const event = pickEvent(state, rng)
            if (event) {
              events.push(event.id)
              const firstChoice = event.choices[0]
              state = reconcileState(state, firstChoice.apply(state))
            }
          }
        }
      }

      return events
    }

    const firstRun = simulate(1234)
    const secondRun = simulate(1234)
    expect(secondRun).toEqual(firstRun)
  })
})
