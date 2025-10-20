import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import {
  advanceDay,
  applyAction,
  createInitialState,
  type GameAction,
  type GameActionType,
  type GameState,
} from './core/engine'
import { GOAL_TARGET, getOutcome } from './core/goals'
import { pickEvent, type GameEvent } from './core/events'
import EventModal from './ui/EventModal'
import { createRng } from './core/rng'
import { UPGRADES, applyUpgrade } from './core/upgrades'
import { clearSave, loadState, saveState } from './core/save'

const containerStyle: CSSProperties = {
  maxWidth: 320,
  margin: '32px auto',
  padding: 16,
  border: '1px solid #ccc',
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const statsListStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
}

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const buttonStyle: CSSProperties = {
  padding: '8px 12px',
}

const shopToggleStyle: CSSProperties = {
  ...buttonStyle,
  alignSelf: 'flex-start',
}

const shopPanelStyle: CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const shopItemStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  borderBottom: '1px solid #eee',
  paddingBottom: 8,
}

const actions: { id: GameActionType; label: string }[] = [
  { id: 'TRAIN', label: 'Train' },
  { id: 'WORK', label: 'Work' },
  { id: 'REST', label: 'Rest' },
]

const Game = () => {
  const [state, setState] = useState<GameState>(() => createInitialState())
  const [pendingEvent, setPendingEvent] = useState<GameEvent | null>(null)
  const [showShop, setShowShop] = useState(false)
  const rngRef = useRef<(() => number) | null>(null)

  if (!rngRef.current) {
    rngRef.current = createRng(Date.now())
  }

  const outcome = useMemo(() => getOutcome(state), [state])

  useEffect(() => {
    const restored = loadState()
    if (restored) {
      setState(restored)
      setPendingEvent(null)
      setShowShop(false)
      rngRef.current = createRng(Date.now())
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const timeout = window.setTimeout(() => {
      saveState(state)
    }, 300)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [state])

  const handleAction = (action: GameAction) => {
    if (pendingEvent || outcome.status !== 'ongoing') {
      return
    }

    setState(current => applyAction(current, action))
  }

  const handleNextDay = () => {
    if (pendingEvent || outcome.status !== 'ongoing') {
      return
    }

    setState(current => {
      const advanced = advanceDay(current)
      const nextOutcome = getOutcome(advanced)

      if (nextOutcome.status === 'ongoing') {
        const rng = rngRef.current
        if (advanced.day !== 1 && rng && rng() < 0.35) {
          const event = pickEvent(advanced, rng)
          if (event) {
            setPendingEvent(event)
          }
        }
      }

      return advanced
    })
  }

  const handleUpgradePurchase = (id: string) => {
    if (outcome.status !== 'ongoing') {
      return
    }
    setState(current => applyUpgrade(current, id))
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

  const handleSaveNow = () => {
    saveState(state)
  }

  const handleLoad = () => {
    const restored = loadState()
    if (restored) {
      setState(restored)
      setPendingEvent(null)
    } else {
      setState(createInitialState())
      setPendingEvent(null)
    }
    setShowShop(false)
    rngRef.current = createRng(Date.now())
  }

  const handleNewRun = () => {
    clearSave()
    setState(createInitialState())
    setPendingEvent(null)
    setShowShop(false)
    rngRef.current = createRng(Date.now())
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
        <button type="button" style={buttonStyle} onClick={handleSaveNow}>
          Save Now
        </button>
        <button type="button" style={buttonStyle} onClick={handleLoad}>
          Load
        </button>
        <button type="button" style={buttonStyle} onClick={handleNewRun}>
          New Run
        </button>
      </div>

      <div style={buttonRowStyle}>
        {actions.map(action => (
          <button
            key={action.id}
            type="button"
            style={buttonStyle}
            onClick={() => handleAction({ type: action.id })}
            disabled={Boolean(pendingEvent) || outcome.status !== 'ongoing'}
          >
            {action.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        style={shopToggleStyle}
        onClick={() => setShowShop(current => !current)}
      >
        {showShop ? 'Hide Shop' : 'Open Shop'}
      </button>

      {showShop ? (
        <div style={shopPanelStyle}>
          <strong>Upgrades</strong>
          {UPGRADES.map(upgrade => {
            const level = state.meta.upgrades[upgrade.id] ?? 0
            const maxLevel = upgrade.repeatable
              ? upgrade.maxLevel ?? Infinity
              : upgrade.maxLevel ?? 1
            const atMax = level >= maxLevel
            const cost = upgrade.cost
            return (
              <div key={upgrade.id} style={shopItemStyle}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{upgrade.name}</span>
                  <span>${cost}</span>
                </div>
                <div style={{ fontSize: 12, color: '#555' }}>{upgrade.desc}</div>
                <div style={{ fontSize: 12 }}>
                  Level: {level}
                  {Number.isFinite(maxLevel) ? ` / ${maxLevel}` : ''}
                </div>
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={() => handleUpgradePurchase(upgrade.id)}
                  disabled={state.money < cost || atMax || outcome.status !== 'ongoing'}
                >
                  {atMax ? 'Maxed' : 'Buy'}
                </button>
              </div>
            )
          })}
        </div>
      ) : null}

      <button
        type="button"
        style={buttonStyle}
        onClick={handleNextDay}
        disabled={Boolean(pendingEvent) || outcome.status !== 'ongoing'}
      >
        Next Day
      </button>

      <div>Goals Completed: {state.meta.goalsCompleted.length} / {GOAL_TARGET}</div>

      {outcome.status === 'won' ? (
        <div style={{ color: 'green', fontWeight: 600 }}>You achieved your goals!</div>
      ) : null}
      {outcome.status === 'lost' ? (
        <div style={{ color: 'crimson', fontWeight: 600 }}>
          Run ended due to {outcome.loseReason === 'morale' ? 'morale' : 'money'}.
        </div>
      ) : null}

      {pendingEvent ? (
        <EventModal event={pendingEvent} onChoose={handleEventChoice} />
      ) : null}
    </div>
  )
}

export default Game
