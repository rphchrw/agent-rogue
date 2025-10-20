import type { GameOutcome, GameState } from './engine'

export const GOAL_TARGET = 3

export const LOSS_CONDITIONS = {
  moraleZeroDays: 2,
  moneyZeroDays: 7,
} as const

type GoalCheck = {
  id: string
  description: string
  isComplete: (state: GameState) => boolean
  reward?: (state: GameState) => GameState
}

const GOALS: GoalCheck[] = [
  {
    id: 'nest-egg',
    description: 'Accumulate $20',
    isComplete: state => state.money >= 20,
  },
  {
    id: 'consistent-training',
    description: 'Train 3 times in a week',
    isComplete: state => state.meta.counters.trainsThisWeek >= 3,
  },
  {
    id: 'well-rested',
    description: 'End 3 days in a row at full energy',
    isComplete: state => state.meta.counters.daysFullEnergy >= 3,
  },
  {
    id: 'high-morale',
    description: 'Reach 8 morale',
    isComplete: state => state.morale >= 8,
  },
  {
    id: 'skilled-agent',
    description: 'Reach 10 skill',
    isComplete: state => state.skill >= 10,
    reward: state => ({
      ...state,
      money: state.money + 5,
    }),
  },
]

export const evaluateGoals = (previous: GameState, next: GameState): GameState => {
  const alreadyCompleted = new Set(previous.meta.goalsCompleted)
  let updatedState = next
  const completed: string[] = [...alreadyCompleted]

  for (const goal of GOALS) {
    const wasComplete = alreadyCompleted.has(goal.id)
    const nowComplete = goal.isComplete(next)

    if (!wasComplete && nowComplete) {
      completed.push(goal.id)
      updatedState = goal.reward ? goal.reward(updatedState) : updatedState
    }
  }

  if (completed.length === previous.meta.goalsCompleted.length) {
    return updatedState
  }

  return {
    ...updatedState,
    meta: {
      ...updatedState.meta,
      goalsCompleted: completed,
    },
  }
}

export const getOutcome = (state: GameState): GameOutcome => {
  if (state.meta.goalsCompleted.length >= GOAL_TARGET) {
    return { status: 'won' }
  }

  if (state.meta.counters.lowMoraleStreak >= LOSS_CONDITIONS.moraleZeroDays) {
    return { status: 'lost', loseReason: 'morale' }
  }

  if (state.meta.counters.zeroMoneyStreak >= LOSS_CONDITIONS.moneyZeroDays) {
    return { status: 'lost', loseReason: 'money' }
  }

  return { status: 'ongoing' }
}
