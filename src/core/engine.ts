export type GameAction = 'Train' | 'Work' | 'Rest'

export interface GameState {
  day: number
  week: number
  energy: number
  morale: number
  skill: number
  money: number
}

interface ActionDelta {
  energy?: number
  morale?: number
  skill?: number
  money?: number
}

const MAX_ENERGY = 10
const MAX_MORALE = 100
const MAX_SKILL = 100

const ACTION_DELTAS: Record<GameAction, ActionDelta> = {
  Train: { energy: -3, morale: +1, skill: +2 },
  Work: { energy: -4, morale: -1, money: +75, skill: +1 },
  Rest: { energy: +5, morale: +3 },
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export function applyAction(state: GameState, action: GameAction): GameState {
  const delta = ACTION_DELTAS[action]
  const energyCost = delta.energy ?? 0

  if (energyCost < 0 && state.energy + energyCost < 0) {
    return state
  }

  const nextEnergy = clamp(state.energy + energyCost, 0, MAX_ENERGY)
  const nextMorale = clamp(state.morale + (delta.morale ?? 0), 0, MAX_MORALE)
  const nextSkill = clamp(state.skill + (delta.skill ?? 0), 0, MAX_SKILL)
  const nextMoney = Math.max(0, state.money + (delta.money ?? 0))

  return {
    ...state,
    energy: nextEnergy,
    morale: nextMorale,
    skill: nextSkill,
    money: nextMoney,
  }
}
