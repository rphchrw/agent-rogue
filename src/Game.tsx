import { useRef, useState } from 'react'

import {
  advanceDay,
  applyAction,
  createInitialState,
  getOutcome,
  GOAL_TARGET,
  LOSS_CONDITIONS,
  reconcileState,
  type GameActionType,
  type GameState,
} from './core/engine'
import { pickEvent, type GameEvent } from './core/events'
import EventModal from './ui/EventModal'
import { createRng } from './core/rng'
import { GOALS } from './core/goals'

type GameEventChoice = GameEvent['choices'][number]

const createInitialGameState = () => createInitialState()

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

const actions: { id: GameActionType; label: string }[] = [
  { id: 'TRAIN', label: 'Train' },
  { id: 'WORK', label: 'Work' },
  { id: 'REST', label: 'Rest' },
]

const milestoneContainerStyle: React.CSSProperties = {
  borderTop: '1px solid #ddd',
  paddingTop: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const milestoneListStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const milestoneItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '4px 0',
}

const bannerStyle: React.CSSProperties = {
  border: '1px solid #888',
  borderRadius: 6,
  padding: 12,
  backgroundColor: '#fdf2d7',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  textAlign: 'center',
}

const Game = () => {
  const [state, setState] = useState<GameState>(() => createInitialGameState())
  const [pendingEvent, setPendingEvent] = useState<GameEvent | null>(null)
  const rngRef = useRef<(() => number) | null>(null)

  if (!rngRef.current) {
    rngRef.current = createRng(Date.now())
  }

  const handleAction = (action: GameActionType) => {
    setState(current => applyAction(current, { type: action }))
  }

  const handleNextDay = () => {
    let nextEvent: GameEvent | null = null
    setState(current => {
      const advanced = advanceDay(current)
      const outcome = getOutcome(advanced)

      if (outcome.status === 'ongoing') {
        const rng = rngRef.current
        if (advanced.day !== 1 && rng) {
          const roll = rng()
          if (roll < 0.35) {
            const event = pickEvent(advanced, rng)
            if (event) {
              nextEvent = event
            }
          }
        }
      }

      return advanced
    })

    if (nextEvent) {
      setPendingEvent(nextEvent)
    }
  }

  const handleEventChoice = (choiceId: string) => {
    const event = pendingEvent
    if (!event) {
      return
    }

    setPendingEvent(null)
    setState(current => {
      const choice = event.choices.find(
        (candidate: GameEventChoice) => candidate.id === choiceId,
      )
      if (!choice) {
        return current
      }

      const result = choice.apply(current)
      return reconcileState(current, result)
    })
  }

  const handleRestart = () => {
    rngRef.current = createRng(Date.now())
    setPendingEvent(null)
    setState(() => createInitialGameState())
  }

  const outcome = getOutcome(state)
  const isGameOver = outcome.status !== 'ongoing'
  const milestoneProgress = `${state.meta.goalsCompleted.length}/${GOAL_TARGET}`

  const outcomeMessage =
    outcome.status === 'won'
      ? `You completed ${milestoneProgress} milestones!`
      : outcome.status === 'lost'
        ? `Mission failed: ${
            outcome.loseReason === 'morale'
              ? `Morale hit zero for ${LOSS_CONDITIONS.moraleZeroDays} days.`
              : `Money stayed at zero for ${LOSS_CONDITIONS.moneyZeroDays} days.`
          }`
        : ''

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

      <div style={buttonRowStyle}>
        {actions.map(action => (
          <button
            key={action.id}
            type="button"
            style={buttonStyle}
            onClick={() => handleAction(action.id)}
            disabled={Boolean(pendingEvent) || isGameOver}
          >
            {action.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        style={buttonStyle}
        onClick={handleNextDay}
        disabled={Boolean(pendingEvent) || isGameOver}
      >
        Next Day
      </button>

      <div style={milestoneContainerStyle}>
        <div>
          <strong>Milestones</strong> ({milestoneProgress})
        </div>
        <ul style={milestoneListStyle}>
          {GOALS.map(goal => {
            const complete = state.meta.goalsCompleted.includes(goal.id)
            return (
              <li key={goal.id} style={milestoneItemStyle}>
                <span>
                  {complete ? '✅' : '⬜️'} {goal.title}
                </span>
                <span style={{ fontSize: 12, color: '#555' }}>{goal.desc}</span>
              </li>
            )
          })}
        </ul>
      </div>

      {pendingEvent ? (
        <EventModal event={pendingEvent} onChoose={handleEventChoice} />
      ) : null}

      {isGameOver ? (
        <div style={bannerStyle}>
          <strong>{outcome.status === 'won' ? 'Mission Complete!' : 'Mission Failed'}</strong>
          <span>{outcomeMessage}</span>
          <button type="button" style={buttonStyle} onClick={handleRestart}>
            Restart
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default Game
