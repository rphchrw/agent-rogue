import type { GameState } from '../../core/engine'
import {
  cloneMilestoneState,
  cloneMilestonesState,
  type GoalsState,
  type MilestoneDefinition,
  type MilestoneState,
  type MilestonesState,
} from './types'

export class MilestoneManager {
  private milestones: MilestonesState

  constructor(initial?: MilestonesState) {
    this.milestones = cloneMilestonesState(initial)
  }

  static fromGameState(state: GameState): MilestoneManager {
    return new MilestoneManager(state.meta?.milestones)
  }

  seedMilestones(definitions: MilestoneDefinition[]): void {
    for (const definition of definitions) {
      const existing = this.milestones.entries.find(entry => entry.id === definition.id)
      if (existing) {
        continue
      }

      const milestone: MilestoneState = {
        ...definition,
        unlocked: false,
        unlockedAt: null,
      }

      this.milestones.entries.push(milestone)
    }
  }

  unlockMilestone(id: string): MilestoneState | null {
    const milestone = this.milestones.entries.find(entry => entry.id === id)
    if (!milestone) {
      return null
    }

    if (!milestone.unlocked) {
      milestone.unlocked = true
      milestone.unlockedAt = Date.now()
      console.log(`🚀 Milestone unlocked: ${milestone.title}`)
    }

    return cloneMilestoneState(milestone)
  }

  isUnlocked(id: string): boolean {
    return Boolean(this.milestones.entries.find(entry => entry.id === id && entry.unlocked))
  }

  getActiveMilestones(): MilestoneState[] {
    return this.milestones.entries.filter(entry => entry.unlocked).map(cloneMilestoneState)
  }

  evaluateFromGoals(goals: GoalsState): MilestoneState[] {
    const completedGoals = new Set(
      goals.completed.map(goal => goal.id).concat(
        goals.active.filter(goal => goal.completed).map(goal => goal.id),
      ),
    )

    const unlockedThisCheck: MilestoneState[] = []

    for (const milestone of this.milestones.entries) {
      if (milestone.unlocked) {
        continue
      }

      const required = milestone.requiredGoals ?? []
      const meetsRequirements = required.every(goalId => completedGoals.has(goalId))

      if (meetsRequirements) {
        const unlocked = this.unlockMilestone(milestone.id)
        if (unlocked) {
          unlockedThisCheck.push(unlocked)
        }
      }
    }

    return unlockedThisCheck.map(cloneMilestoneState)
  }

  getState(): MilestonesState {
    return cloneMilestonesState(this.milestones)
  }

  applyToGameState(state: GameState): GameState {
    const meta = state.meta ?? { upgrades: {}, effects: {} }
    return {
      ...state,
      meta: {
        ...meta,
        milestones: this.getState(),
      },
    }
  }
}
