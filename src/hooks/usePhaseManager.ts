import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  PHASES,
  buildEndDaySummary,
  incrementDayWeek,
  nextPhase,
  type DayWeek,
  type EndDaySummary,
  type Phase,
} from '../core/phaseMachine'

interface UsePhaseManagerOptions {
  onPhaseChange?: (phase: Phase) => void
  onDayStart?: (dayWeek: DayWeek) => void
  onDayEnd?: (summary: EndDaySummary) => void
  autoStart?: boolean
}

interface UsePhaseManagerValue {
  phase: Phase | null
  day: number
  week: number
  started: boolean
  startDay: () => void
  endPhase: () => void
  endDay: () => void
}

const INITIAL_DAY_WEEK: DayWeek = { day: 1, week: 1 }
const ACTION_GUARD_MS = 200

const includePhaseOnce = (collection: Phase[], item: Phase): Phase[] =>
  collection.includes(item) ? collection : [...collection, item]

export function usePhaseManager(options?: UsePhaseManagerOptions): UsePhaseManagerValue {
  const { onPhaseChange, onDayStart, onDayEnd, autoStart = false } = options ?? {}
  const [dayWeek, setDayWeek] = useState<DayWeek>(INITIAL_DAY_WEEK)
  const [phase, setPhase] = useState<Phase | null>(null)
  const [started, setStarted] = useState(false)
  const completedPhasesRef = useRef<Phase[]>([])
  const guardRef = useRef(0)

  const markAction = useCallback(
    (override = false) => {
      const now = Date.now()

      if (!override && now - guardRef.current < ACTION_GUARD_MS) {
        return false
      }

      guardRef.current = now
      return true
    },
    [],
  )

  const beginPhase = useCallback(
    (next: Phase) => {
      setPhase(next)
      onPhaseChange?.(next)
    },
    [onPhaseChange],
  )

  const recordPhaseCompletion = useCallback((finished: Phase) => {
    completedPhasesRef.current = includePhaseOnce(completedPhasesRef.current, finished)
  }, [])

  const startDayInternal = useCallback(
    (override = false) => {
      if (started) {
        return
      }

      if (!markAction(override)) {
        return
      }

      setStarted(true)
      completedPhasesRef.current = []
      onDayStart?.(dayWeek)
      beginPhase(PHASES[0])
    },
    [beginPhase, dayWeek, markAction, onDayStart, started],
  )

  const endDayInternal = useCallback(
    (override = false) => {
      if (!started) {
        return
      }

      if (!markAction(override)) {
        return
      }

      const current: DayWeek = { ...dayWeek }
      const summaryBase = buildEndDaySummary(current)
      const phasesCompleted = [...completedPhasesRef.current]
      const summary: EndDaySummary = {
        ...summaryBase,
        phasesCompleted,
      }

      onDayEnd?.(summary)

      const next = incrementDayWeek(current)
      setDayWeek(next)
      completedPhasesRef.current = []
      onDayStart?.(next)
      beginPhase(PHASES[0])
    },
    [beginPhase, dayWeek, markAction, onDayEnd, onDayStart, started],
  )

  const endPhase = useCallback(() => {
    if (!started || phase === null) {
      return
    }

    if (!markAction()) {
      return
    }

    const currentPhase = phase
    recordPhaseCompletion(currentPhase)
    const next = nextPhase(currentPhase)

    if (next) {
      beginPhase(next)
      return
    }

    endDayInternal(true)
  }, [beginPhase, endDayInternal, markAction, phase, recordPhaseCompletion, started])

  const endDay = useCallback(() => {
    endDayInternal(false)
  }, [endDayInternal])

  const startDay = useCallback(() => {
    startDayInternal(false)
  }, [startDayInternal])

  useEffect(() => {
    if (autoStart && !started) {
      startDayInternal(true)
    }
  }, [autoStart, startDayInternal, started])

  const value = useMemo(
    () => ({
      phase,
      day: dayWeek.day,
      week: dayWeek.week,
      started,
      startDay,
      endPhase,
      endDay,
    }),
    [dayWeek.day, dayWeek.week, endDay, endPhase, phase, startDay, started],
  )

  return value
}
