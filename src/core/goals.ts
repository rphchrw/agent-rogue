import type { GameState } from './engine'

export type Goal = {
  id: string
  title: string
  desc: string
  isComplete: (state: GameState) => boolean
  reward?: (state: GameState) => GameState
}

const clampMorale = (value: number): number => Math.max(0, value)

const clampEnergy = (value: number, max: number): number => Math.min(Math.max(value, 0), max)

export const GOALS: Goal[] = [
  {
    id: 'first-paycheck',
    title: 'First Paycheck',
    desc: 'Reach $20 in savings.',
    isComplete: state => state.money >= 20,
    reward: state => ({
      ...state,
      morale: clampMorale(state.morale + 1),
    }),
  },
  {
    id: 'focused-week',
    title: 'Focused Week',
    desc: 'Train three times in a single week.',
    isComplete: state => state.meta.counters.trainsThisWeek >= 3,
    reward: state => ({
      ...state,
      skill: state.skill + 1,
    }),
  },
  {
    id: 'early-riser',
    title: 'Early Riser',
    desc: 'End the day with full energy three times.',
    isComplete: state => state.meta.counters.daysFullEnergy >= 3,
    reward: state => ({
      ...state,
      energy: clampEnergy(state.energy + 1, state.maxEnergy),
    }),
  },
  {
    id: 'networking',
    title: 'Networking',
    desc: 'Push morale to 8 or higher.',
    isComplete: state => state.morale >= 8,
    reward: state => ({
      ...state,
      money: state.money + 2,
    }),
  },
  {
    id: 'skilled',
    title: 'Skilled',
    desc: 'Raise your skill to 10.',
    isComplete: state => state.skill >= 10,
  },
]

export const evaluateGoals = (
  _prev: GameState,
  next: GameState,
): { state: GameState; completed: string[] } => {
  let updatedState = next
  const completed = new Set(updatedState.meta.goalsCompleted)
  const newlyCompleted: string[] = []

  for (const goal of GOALS) {
    if (completed.has(goal.id)) {
      continue
    }

    if (!goal.isComplete(updatedState)) {
      continue
    }

    completed.add(goal.id)
    newlyCompleted.push(goal.id)

    if (goal.reward) {
      updatedState = goal.reward(updatedState)
    }
  }

  updatedState = {
    ...updatedState,
    meta: {
      ...updatedState.meta,
      goalsCompleted: Array.from(completed),
    },
  }

  return { state: updatedState, completed: newlyCompleted }
}
