import type { GameState } from '../src/core/engine'
import { GoalManager } from '../src/systems/goals/GoalManager'
import { MilestoneManager } from '../src/systems/goals/MilestoneManager'
import { EXAMPLE_GOALS, EXAMPLE_MILESTONES } from '../src/systems/goals/sampleData'

const createBaseState = (): GameState => ({
  day: 1,
  week: 1,
  energy: 6,
  maxEnergy: 6,
  morale: 5,
  skill: 0,
  money: 10,
  meta: {
    upgrades: {},
    effects: {},
  },
})

const primeProgression = (state: GameState): GameState => {
  const goalManager = GoalManager.fromGameState(state)
  goalManager.seedGoals(EXAMPLE_GOALS)
  const withGoals = goalManager.applyToGameState(state)

  const milestoneManager = MilestoneManager.fromGameState(withGoals)
  milestoneManager.seedMilestones(EXAMPLE_MILESTONES)
  return milestoneManager.applyToGameState(withGoals)
}

const advanceDayWithGoals = (state: GameState): GameState => {
  const nextDay = state.day + 1
  const wrappedDay = nextDay > 7 ? 1 : nextDay
  const nextWeek = nextDay > 7 ? state.week + 1 : state.week

  let working: GameState = {
    ...state,
    day: wrappedDay,
    week: nextWeek,
    energy: state.maxEnergy,
    error: undefined,
  }

  const goalManager = GoalManager.fromGameState(working)
  goalManager.seedGoals(EXAMPLE_GOALS)

  const dailyGoals = goalManager.getState().active.filter(goal => goal.type === 'daily')
  for (const goal of dailyGoals) {
    goalManager.updateGoalProgress(goal.id, 1)
  }

  const completedToday = goalManager.checkCompletion()
  for (const goal of completedToday) {
    console.log(`✅ Completed today: ${goal.title}`)
  }

  working = goalManager.applyToGameState(working)

  const milestoneManager = MilestoneManager.fromGameState(working)
  milestoneManager.seedMilestones(EXAMPLE_MILESTONES)
  const unlocked = milestoneManager.evaluateFromGoals(goalManager.getState())
  for (const milestone of unlocked) {
    console.log(`🚀 Milestone unlocked: ${milestone.title}`)
  }

  working = milestoneManager.applyToGameState(working)

  return working
}

let state = primeProgression(createBaseState())

console.log('Initial daily goals:')
GoalManager.fromGameState(state)
  .getState()
  .active.filter(goal => goal.type === 'daily')
  .forEach(goal => {
    console.log(`- ${goal.title}: ${goal.progress}/${goal.target}`)
  })

console.log('\nAdvancing one day...')
state = advanceDayWithGoals(state)

const refreshedGoals = GoalManager.fromGameState(state).getState()

console.log('\nDaily goals after advancing:')
refreshedGoals.active
  .filter(goal => goal.type === 'daily')
  .forEach(goal => {
    console.log(`- ${goal.title}: ${goal.progress}/${goal.target}`)
  })

if (refreshedGoals.completed.length > 0) {
  console.log('\nCompleted goals:')
  refreshedGoals.completed.forEach(goal => {
    console.log(`- ${goal.title}`)
  })
}
