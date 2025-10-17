export const PHASES = ['Morning', 'Afternoon', 'Night'] as const

export type Phase = typeof PHASES[number]

export interface DayWeek {
  day: number
  week: number
}

export interface EndDaySummary {
  endedDay: number
  endedWeek: number
  phasesCompleted: Phase[]
}

export function nextPhase(phase: Phase): Phase | null {
  const index = PHASES.indexOf(phase)

  if (index === -1 || index >= PHASES.length - 1) {
    return null
  }

  return PHASES[index + 1]
}

export function incrementDayWeek({ day, week }: DayWeek): DayWeek {
  const nextDay = day + 1

  if (nextDay > 7) {
    return {
      day: 1,
      week: week + 1,
    }
  }

  return {
    day: nextDay,
    week,
  }
}

export function buildEndDaySummary({ day, week }: DayWeek): EndDaySummary {
  return {
    endedDay: day,
    endedWeek: week,
    phasesCompleted: [...PHASES],
  }
}
