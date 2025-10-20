import { describe, expect, it } from 'vitest'

import { evaluateGoals } from '../src/core/goals'
import {
  advanceDay,
  createInitialState,
  getOutcome,
  GOAL_TARGET,
  LOSS_CONDITIONS,
} from '../src/core/engine'
import type { GameState } from '../src/core/engine'

const cloneState = (state: GameState): GameState => ({
  ...state,
  meta: {
    ...state.meta,
    upgrades: { ...state.meta.upgrades },
    effects: { ...state.meta.effects },
    counters: { ...state.meta.counters },
    goalsCompleted: [...state.meta.goalsCompleted],
  },
})

describe('goals system', () => {
  it('completes goals and applies rewards', () => {
    const start = createInitialState()

    const withMoney = cloneState(start)
    withMoney.money = 25

    const firstResult = evaluateGoals(start, withMoney)
    expect(firstResult.completed).toEqual(['first-paycheck'])
    expect(firstResult.state.meta.goalsCompleted).toContain('first-paycheck')
    expect(firstResult.state.morale).toBe(start.morale + 1)

    const withMorale = cloneState(firstResult.state)
    withMorale.morale = 9

    const secondResult = evaluateGoals(firstResult.state, withMorale)
    expect(secondResult.completed).toEqual(['networking'])
    expect(secondResult.state.meta.goalsCompleted).toContain('networking')
    expect(secondResult.state.money).toBe(withMorale.money + 2)

    const noNewResult = evaluateGoals(secondResult.state, secondResult.state)
    expect(noNewResult.completed).toHaveLength(0)
  })

  it('marks the game as won after reaching the goal target', () => {
    const start = createInitialState()

    const moneyState = cloneState(start)
    moneyState.money = 25
    const afterMoney = evaluateGoals(start, moneyState).state

    const moraleState = cloneState(afterMoney)
    moraleState.morale = 9
    const afterMorale = evaluateGoals(afterMoney, moraleState).state

    const skillState = cloneState(afterMorale)
    skillState.skill = 12
    const afterSkill = evaluateGoals(afterMorale, skillState).state

    expect(afterSkill.meta.goalsCompleted.length).toBeGreaterThanOrEqual(GOAL_TARGET)
    expect(getOutcome(afterSkill).status).toBe('won')
  })

  it('triggers morale-based loss after consecutive zero days', () => {
    const start = createInitialState()
    const moraleThreshold = LOSS_CONDITIONS.moraleZeroDays

    const preLoss = cloneState(start)
    preLoss.morale = 0
    preLoss.meta.counters.lowMoraleStreak = moraleThreshold - 1

    const advanced = advanceDay(preLoss)
    const outcome = getOutcome(advanced)

    expect(outcome.status).toBe('lost')
    expect(outcome.loseReason).toBe('morale')
  })

  it('triggers money-based loss after a week at zero cash', () => {
    const start = createInitialState()
    const moneyThreshold = LOSS_CONDITIONS.moneyZeroDays

    const preLoss = cloneState(start)
    preLoss.money = 0
    preLoss.meta.counters.zeroMoneyStreak = moneyThreshold - 1

    const advanced = advanceDay(preLoss)
    const outcome = getOutcome(advanced)

    expect(outcome.status).toBe('lost')
    expect(outcome.loseReason).toBe('money')
  })
})
