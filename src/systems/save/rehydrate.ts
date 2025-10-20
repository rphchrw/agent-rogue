import { cloneGoalsState, cloneMilestonesState, createEmptyGoalsState, createEmptyMilestonesState } from '../goals/types'
import type { SaveStateGoal, SaveStateV1 } from './types'

const ensureMetaShape = (meta: any): any => {
  const base = meta && typeof meta === 'object' ? meta : {}
  return {
    ...base,
    upgrades: { ...(base.upgrades ?? {}) },
    effects: { ...(base.effects ?? {}) },
    inventory: Array.isArray(base.inventory) ? [...base.inventory] : [],
    flags: { ...(base.flags ?? {}) },
    goals: base.goals ? cloneGoalsState(base.goals) : createEmptyGoalsState(),
    milestones: base.milestones ? cloneMilestonesState(base.milestones) : createEmptyMilestonesState(),
  }
}

const applyGoalSnapshots = (goals: ReturnType<typeof cloneGoalsState>, snapshots: SaveStateGoal[]): ReturnType<typeof cloneGoalsState> => {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return goals
  }

  const active: typeof goals.active = []
  const completed: typeof goals.completed = []
  const byId = new Map<string, SaveStateGoal>()
  for (const entry of snapshots) {
    if (entry && typeof entry.id === 'string') {
      byId.set(entry.id, entry)
    }
  }

  const mapGoal = (goal: any, fallbackDone: boolean) => {
    if (!goal || typeof goal !== 'object') {
      return
    }

    const id = typeof goal.id === 'string' ? goal.id : null
    if (!id) {
      return
    }

    const snapshot = byId.get(id)
    if (!snapshot) {
      if (fallbackDone) {
        completed.push(goal)
      } else {
        active.push(goal)
      }
      return
    }

    const target = typeof goal.target === 'number' && Number.isFinite(goal.target) ? goal.target : undefined
    const progress = Number.isFinite(snapshot.progress) ? snapshot.progress : 0
    const clampedProgress = target != null ? Math.min(Math.max(progress, 0), Math.max(target, 0)) : Math.max(progress, 0)
    const completedGoal = snapshot.done || clampedProgress >= (target ?? clampedProgress)
    const updated = {
      ...goal,
      progress: clampedProgress,
      completed: completedGoal,
      completedAt: completedGoal ? goal.completedAt ?? Date.now() : null,
    }

    if (completedGoal) {
      completed.push(updated)
    } else {
      active.push(updated)
    }
  }

  for (const goal of goals.active) {
    mapGoal(goal, false)
  }

  for (const goal of goals.completed) {
    mapGoal(goal, true)
  }

  return {
    active,
    completed,
  }
}

const applyMilestoneSnapshots = (
  milestones: ReturnType<typeof cloneMilestonesState>,
  unlockedIds: string[],
): ReturnType<typeof cloneMilestonesState> => {
  if (!Array.isArray(unlockedIds) || unlockedIds.length === 0) {
    return milestones
  }

  const unlockedSet = new Set(unlockedIds)
  const entries = milestones.entries.map(entry => {
    if (!entry || typeof entry !== 'object') {
      return entry
    }

    if (!unlockedSet.has(entry.id)) {
      return { ...entry, unlocked: false }
    }

    return {
      ...entry,
      unlocked: true,
      unlockedAt: entry.unlockedAt ?? Date.now(),
    }
  })

  return { entries }
}

export function toGameState(save: SaveStateV1, defaults: any): any {
  const base = defaults && typeof defaults === 'object' ? { ...defaults } : {}
  const meta = ensureMetaShape(base.meta)

  const next: any = {
    ...base,
    day: Number.isFinite(save.day) ? save.day : 1,
    week: Number.isFinite(save.week) ? save.week : 1,
    energy: Number.isFinite(save.energy) ? save.energy : 0,
    meta,
  }

  const applyStat = (key: string, value: number) => {
    if (!Number.isFinite(value)) {
      return
    }

    if (key.startsWith('meta.upgrades.')) {
      const id = key.slice('meta.upgrades.'.length)
      if (id) {
        meta.upgrades[id] = value
      }
      return
    }

    if (key.startsWith('meta.effects.')) {
      const id = key.slice('meta.effects.'.length)
      if (id) {
        meta.effects[id] = value
      }
      return
    }

    if (key in next) {
      next[key] = value
      return
    }

    meta.stats = meta.stats && typeof meta.stats === 'object' ? { ...meta.stats } : {}
    meta.stats[key] = value
  }

  for (const [key, value] of Object.entries(save.stats)) {
    applyStat(key, value)
  }

  if (Array.isArray(save.inventory)) {
    meta.inventory = save.inventory.map(entry => ({ ...entry }))
  }

  if (save.flags && typeof save.flags === 'object') {
    meta.flags = {
      ...meta.flags,
      ...save.flags,
    }
  }

  meta.goals = applyGoalSnapshots(meta.goals, save.goals)
  meta.milestones = applyMilestoneSnapshots(meta.milestones, save.milestones)

  meta.goalSnapshots = save.goals
  meta.milestoneSnapshots = save.milestones
  meta.version = save.version

  return next
}
