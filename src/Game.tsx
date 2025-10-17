import { useState } from 'react'

import { applyAction, type GameAction, type GameState } from './core/engine'

const initialState: GameState = {
  day: 1,
  week: 1,
  energy: 6,
  maxEnergy: 6,
  morale: 5,
  skill: 0,
  money: 10,
}

const containerStyle: React.CSSProperties = {
  maxWidth: 320,
  margin: '32px auto',
  padding: 16,
  border: '1px solid #ccc',
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const statsListStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
}

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const buttonStyle: React.CSSProperties = {
  padding: '8px 12px',
}

const actions: { id: GameAction; label: string }[] = [
  { id: 'TRAIN', label: 'Train' },
  { id: 'WORK', label: 'Work' },
  { id: 'REST', label: 'Rest' },
]

const Game = () => {
  const [state, setState] = useState<GameState>(initialState)

  const handleAction = (action: GameAction) => {
    setState(current => applyAction(current, action))
  }

  const handleNextDay = () => {
    setState(current => {
      let nextDay = current.day + 1
      let nextWeek = current.week

      if (nextDay > 7) {
        nextDay = 1
        nextWeek += 1
      }

      return {
        ...current,
        day: nextDay,
        week: nextWeek,
        energy: current.maxEnergy,
        error: undefined,
      }
    })
  }

  return (
    <div style={containerStyle}>
      <h1>Agent Rogue</h1>

      <div style={statsListStyle}>
        <div>Day: {state.day}</div>
        <div>Week: {state.week}</div>
        <div>
          Energy: {state.energy}/{state.maxEnergy}
        </div>
        <div>Morale: {state.morale}</div>
        <div>Skill: {state.skill}</div>
        <div>Money: ${state.money}</div>
      </div>

      {state.error ? <div style={{ color: 'crimson' }}>{state.error}</div> : null}

      <div style={buttonRowStyle}>
        {actions.map(action => (
          <button
            key={action.id}
            type="button"
            style={buttonStyle}
            onClick={() => handleAction(action.id)}
          >
            {action.label}
          </button>
        ))}
      </div>

      <button type="button" style={buttonStyle} onClick={handleNextDay}>
        Next Day
      </button>
    </div>
  )
}

export default Game
