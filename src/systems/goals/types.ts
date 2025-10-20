export type GoalType = 'daily' | 'weekly' | 'story'

export interface GoalDefinition {
  id: string
  type: GoalType
  title: string
  description: string
  target: number
  reward?: string
}

export interface GoalInstance extends GoalDefinition {
  progress: number
  completed: boolean
  createdAt: number
  completedAt?: number | null
}

export interface GoalsState {
  active: GoalInstance[]
  completed: GoalInstance[]
}

export interface MilestoneDefinition {
  id: string
  title: string
  description: string
  requiredGoals?: string[]
}

export interface MilestoneState extends MilestoneDefinition {
  unlocked: boolean
  unlockedAt?: number | null
}

export interface MilestonesState {
  entries: MilestoneState[]
}

export const createEmptyGoalsState = (): GoalsState => ({
  active: [],
  completed: [],
})

export const createEmptyMilestonesState = (): MilestonesState => ({
  entries: [],
})

export const cloneGoalInstance = (goal: GoalInstance): GoalInstance => ({
  ...goal,
})

export const cloneGoalsState = (state?: GoalsState | null): GoalsState => {
  const source = state ?? createEmptyGoalsState()
  return {
    active: source.active.map(cloneGoalInstance),
    completed: source.completed.map(cloneGoalInstance),
  }
}

export const cloneMilestoneState = (milestone: MilestoneState): MilestoneState => ({
  ...milestone,
  requiredGoals: milestone.requiredGoals ? [...milestone.requiredGoals] : undefined,
})

export const cloneMilestonesState = (
  state?: MilestonesState | null,
): MilestonesState => {
  const source = state ?? createEmptyMilestonesState()
  return {
    entries: source.entries.map(cloneMilestoneState),
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object'

const isGoalType = (value: unknown): value is GoalType =>
  value === 'daily' || value === 'weekly' || value === 'story'

const sanitizeNumber = (value: unknown): number | null => {
  if (typeof value !== 'number') {
    return null
  }

  return Number.isFinite(value) ? value : null
}

const sanitizeString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null

const sanitizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined
  }

  const entries: string[] = []
  for (const item of value) {
    if (typeof item === 'string') {
      entries.push(item)
    }
  }

  return entries
}

export const sanitizeGoalInstance = (value: unknown): GoalInstance | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = sanitizeString(value.id)
  const type = isGoalType(value.type) ? value.type : null
  const title = sanitizeString(value.title)
  const description = sanitizeString(value.description) ?? ''
  const target = sanitizeNumber(value.target)
  const progress = sanitizeNumber(value.progress) ?? 0
  const createdAt = sanitizeNumber(value.createdAt) ?? Date.now()
  const completedAt = value.completedAt == null ? null : sanitizeNumber(value.completedAt)
  const reward = sanitizeString(value.reward) ?? undefined
  const completed = Boolean(value.completed)

  if (!id || !type || !title || target === null) {
    return null
  }

  return {
    id,
    type,
    title,
    description,
    target,
    reward,
    progress: Math.max(0, progress),
    completed,
    createdAt,
    completedAt: completedAt ?? null,
  }
}

export const sanitizeGoalsState = (value: unknown): GoalsState => {
  if (!isRecord(value)) {
    return createEmptyGoalsState()
  }

  const active: GoalInstance[] = []
  const completed: GoalInstance[] = []

  if (Array.isArray(value.active)) {
    for (const entry of value.active) {
      const goal = sanitizeGoalInstance(entry)
      if (goal) {
        active.push(goal)
      }
    }
  }

  if (Array.isArray(value.completed)) {
    for (const entry of value.completed) {
      const goal = sanitizeGoalInstance(entry)
      if (goal) {
        completed.push(goal)
      }
    }
  }

  return {
    active,
    completed,
  }
}

export const sanitizeMilestoneState = (value: unknown): MilestoneState | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = sanitizeString(value.id)
  const title = sanitizeString(value.title)
  const description = sanitizeString(value.description) ?? ''
  const requiredGoals = sanitizeStringArray(value.requiredGoals)
  const unlocked = Boolean(value.unlocked)
  const unlockedAt = value.unlockedAt == null ? null : sanitizeNumber(value.unlockedAt)

  if (!id || !title) {
    return null
  }

  return {
    id,
    title,
    description,
    requiredGoals,
    unlocked,
    unlockedAt: unlockedAt ?? null,
  }
}

export const sanitizeMilestonesState = (value: unknown): MilestonesState => {
  if (!isRecord(value)) {
    return createEmptyMilestonesState()
  }

  const entries: MilestoneState[] = []

  if (Array.isArray(value.entries)) {
    for (const entry of value.entries) {
      const milestone = sanitizeMilestoneState(entry)
      if (milestone) {
        entries.push(milestone)
      }
    }
  }

  return { entries }
}
