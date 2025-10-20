import type { GameState } from '../../core/engine'
import {
  cloneGoalInstance,
  cloneGoalsState,
  type GoalDefinition,
  type GoalInstance,
  type GoalsState,
} from './types'

export class GoalManager {
  private goals: GoalsState

  constructor(initial?: GoalsState) {
    this.goals = cloneGoalsState(initial)
  }

  static fromGameState(state: GameState): GoalManager {
    return new GoalManager(state.meta?.goals)
  }

  seedGoals(definitions: GoalDefinition[]): void {
    for (const definition of definitions) {
      const existing = this.getGoalById(definition.id)
      if (existing) {
        continue
      }
      this.addGoal(definition)
    }
  }

  addGoal(goal: GoalDefinition): GoalInstance {
    const existing = this.getGoalById(goal.id)
    if (existing) {
      return existing
    }

    const instance: GoalInstance = {
      ...goal,
      progress: 0,
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
    }

    this.goals.active.push(instance)
    return cloneGoalInstance(instance)
  }

  updateGoalProgress(id: string, amount: number): GoalInstance | null {
    if (!Number.isFinite(amount)) {
      return null
    }

    const goal = this.goals.active.find(entry => entry.id === id)
    if (!goal) {
      const completed = this.goals.completed.find(entry => entry.id === id)
      return completed ? cloneGoalInstance(completed) : null
    }

    const nextProgress = Math.max(0, goal.progress + amount)
    goal.progress = Math.min(nextProgress, goal.target)

    return cloneGoalInstance(goal)
  }

  checkCompletion(): GoalInstance[] {
    const newlyCompleted: GoalInstance[] = []
    const remaining: GoalInstance[] = []

    for (const goal of [...this.goals.active]) {
      if (!goal.completed && goal.progress >= goal.target) {
        const completed = this.completeGoal(goal.id)
        if (completed) {
          newlyCompleted.push(completed)
        }
      } else {
        remaining.push(goal)
      }
    }

    this.goals.active = remaining

    return newlyCompleted.map(cloneGoalInstance)
  }

  completeGoal(id: string): GoalInstance | null {
    const index = this.goals.active.findIndex(goal => goal.id === id)
    if (index === -1) {
      const existing = this.goals.completed.find(goal => goal.id === id)
      return existing ? cloneGoalInstance(existing) : null
    }

    const [goal] = this.goals.active.splice(index, 1)
    goal.completed = true
    goal.progress = Math.max(goal.progress, goal.target)
    goal.completedAt = Date.now()

    this.goals.completed.push(goal)

    console.log(`✅ Goal complete: ${goal.title}`)

    return cloneGoalInstance(goal)
  }

  getActiveGoals(): GoalInstance[] {
    return this.goals.active.map(cloneGoalInstance)
  }

  getCompletedGoals(): GoalInstance[] {
    return this.goals.completed.map(cloneGoalInstance)
  }

  getGoalById(id: string): GoalInstance | null {
    const active = this.goals.active.find(goal => goal.id === id)
    if (active) {
      return cloneGoalInstance(active)
    }

    const completed = this.goals.completed.find(goal => goal.id === id)
    return completed ? cloneGoalInstance(completed) : null
  }

  getState(): GoalsState {
    return cloneGoalsState(this.goals)
  }

  applyToGameState(state: GameState): GameState {
    const meta = state.meta ?? { upgrades: {}, effects: {} }
    return {
      ...state,
      meta: {
        ...meta,
        goals: this.getState(),
      },
    }
  }
}
