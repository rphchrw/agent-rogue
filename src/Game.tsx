import { useRef, useState } from 'react'

import { applyAction, type GameAction, type GameState } from './core/engine'
import { pickEvent, type GameEvent } from './core/events'
import EventModal from './ui/EventModal'
import { createRng } from './core/rng'

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
  const [pendingEvent, setPendingEvent] = useState<GameEvent | null>(null)
  const rngRef = useRef<(() => number) | null>(null)

  if (!rngRef.current) {
    rngRef.current = createRng(Date.now())
  }

  const handleAction = (action: GameAction) => {
    setState(current => applyAction(current, action))
  }

  const handleNextDay = () => {
    let triggeredEvent: GameEvent | null = null

    setState(current => {
      let nextDay = current.day + 1
      let nextWeek = current.week

      if (nextDay > 7) {
        nextDay = 1
        nextWeek += 1
      }

      const updated: GameState = {
        ...current,
        day: nextDay,
        week: nextWeek,
        energy: current.maxEnergy,
        error: undefined,
      }

      if (updated.day !== 1 && rngRef.current) {
        const roll = rngRef.current()
        if (roll < 0.35) {
          const event = pickEvent(updated, rngRef.current)
          if (event) {
            triggeredEvent = event
          }
        }
      }

      return updated
    })

    if (triggeredEvent) {
      setPendingEvent(triggeredEvent)
    }
  }

  const handleEventChoice = (choiceId: string) => {
    const event = pendingEvent
    if (!event) {
      return
    }

    setPendingEvent(null)
    setState(current => {
      const choice = event.choices.find(c => c.id === choiceId)
      if (!choice) {
        return current
      }

      return choice.apply(current)
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
            disabled={Boolean(pendingEvent)}
          >
            {action.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        style={buttonStyle}
        onClick={handleNextDay}
        disabled={Boolean(pendingEvent)}
      >
        Next Day
      </button>

      {pendingEvent ? (
        <EventModal event={pendingEvent} onChoose={handleEventChoice} />
      ) : null}
    </div>
  )
}

export default Game
