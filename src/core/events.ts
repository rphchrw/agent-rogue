import type { GameState } from './engine'

export type GameEvent = {
  id: string
  title: string
  text: string
  weight: number
  minDay?: number
  minWeek?: number
  choices: Array<{
    id: string
    label: string
    apply: (s: GameState) => GameState
  }>
}

type StatDelta = Partial<{
  energy: number
  morale: number
  skill: number
  money: number
}>

const clampNonNegative = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

const applyDelta = (state: GameState, delta: StatDelta): GameState => {
  const nextEnergy = clampNonNegative(
    Math.min(state.maxEnergy, state.energy + (delta.energy ?? 0)),
  )
  const nextMorale = clampNonNegative(state.morale + (delta.morale ?? 0))
  const nextSkill = clampNonNegative(state.skill + (delta.skill ?? 0))
  const nextMoney = clampNonNegative(state.money + (delta.money ?? 0))

  return {
    ...state,
    energy: nextEnergy,
    morale: nextMorale,
    skill: nextSkill,
    money: nextMoney,
  }
}

export const EVENTS: GameEvent[] = [
  {
    id: 'overtime-offer',
    title: 'Overtime Offer',
    text: 'A lucrative contract needs a quick turnaround. Do you stay late?',
    weight: 3,
    minDay: 2,
    choices: [
      {
        id: 'take-it',
        label: 'Take the overtime (+$8, -1 morale, -1 energy)',
        apply: state =>
          applyDelta(state, { money: 8, morale: -1, energy: -1 }),
      },
      {
        id: 'decline',
        label: 'Decline and rest (+1 morale)',
        apply: state => applyDelta(state, { morale: 1 }),
      },
    ],
  },
  {
    id: 'mentor-session',
    title: 'Mentor Session',
    text: 'A senior agent offers to review your work if you can spare the time.',
    weight: 2,
    minWeek: 2,
    choices: [
      {
        id: 'attend',
        label: 'Attend (+2 skill, -1 energy, +1 morale)',
        apply: state => applyDelta(state, { skill: 2, energy: -1, morale: 1 }),
      },
      {
        id: 'reschedule',
        label: 'Reschedule (-1 morale)',
        apply: state => applyDelta(state, { morale: -1 }),
      },
    ],
  },
  {
    id: 'coffee-break',
    title: 'Coffee Break',
    text: 'The team heads out for fancy lattes. Do you join them?',
    weight: 2,
    choices: [
      {
        id: 'treat-team',
        label: 'Treat the team (+2 morale, -$2)',
        apply: state => applyDelta(state, { morale: 2, money: -2 }),
      },
      {
        id: 'skip',
        label: 'Skip and sip water (+1 energy)',
        apply: state => applyDelta(state, { energy: 1 }),
      },
    ],
  },
  {
    id: 'bug-bash',
    title: 'Bug Bash',
    text: 'A critical bug bash needs volunteers to crush lingering issues.',
    weight: 2,
    minWeek: 2,
    minDay: 3,
    choices: [
      {
        id: 'dive-in',
        label: 'Dive in (+2 skill, -2 energy)',
        apply: state => applyDelta(state, { skill: 2, energy: -2 }),
      },
      {
        id: 'coordinate',
        label: 'Coordinate (+1 skill, -1 energy, +1 morale)',
        apply: state => applyDelta(state, { skill: 1, energy: -1, morale: 1 }),
      },
    ],
  },
  {
    id: 'unexpected-bill',
    title: 'Unexpected Bill',
    text: 'A forgotten invoice arrives and needs to be handled immediately.',
    weight: 1,
    minDay: 2,
    choices: [
      {
        id: 'pay-now',
        label: 'Pay it now (-$4, -1 morale)',
        apply: state => applyDelta(state, { money: -4, morale: -1 }),
      },
      {
        id: 'negotiate',
        label: 'Negotiate (-$2)',
        apply: state => applyDelta(state, { money: -2 }),
      },
    ],
  },
]

export function pickEvent(state: GameState, rng: () => number): GameEvent | null {
  const eligible = EVENTS.filter(event => {
    if (event.minDay !== undefined && state.day < event.minDay) {
      return false
    }

    if (event.minWeek !== undefined && state.week < event.minWeek) {
      return false
    }

    return true
  })

  if (eligible.length === 0) {
    return null
  }

  const totalWeight = eligible.reduce((sum, event) => sum + Math.max(0, event.weight), 0)

  if (totalWeight <= 0) {
    return null
  }

  const roll = rng() * totalWeight
  let cumulative = 0

  for (const event of eligible) {
    cumulative += Math.max(0, event.weight)
    if (roll < cumulative) {
      return event
    }
  }

  return eligible[eligible.length - 1]
}
