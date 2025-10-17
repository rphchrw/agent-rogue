import { useEffect, useRef, useState } from 'react'

import { applyAction, type GameAction, type GameState } from './core/engine'
import { pickEvent, type GameEvent } from './core/events'
import EventModal from './ui/EventModal'
import { createRng } from './core/rng'
import { UPGRADES, applyDailyPassives, applyUpgrade } from './core/upgrades'
import { clearSave, loadState, saveState } from './core/save'

const createInitialState = (): GameState => ({
  day: 1,
  week: 1,
  energy: 6,
  maxEnergy: 6,
  morale: 5,
  skill: 0,
  money: 10,
  meta: {
    upgrades: {},
    effects: {},
  },
})

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

const shopToggleStyle: React.CSSProperties = {
  ...buttonStyle,
  alignSelf: 'flex-start',
}

const shopPanelStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const shopItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  borderBottom: '1px solid #eee',
  paddingBottom: 8,
}

const actions: { id: GameAction; label: string }[] = [
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

  useEffect(() => {
    const restored = loadState()
    if (restored) {
      setState(restored)
      setPendingEvent(null)
      setShowShop(false)
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

      const updated: GameState = {
        ...current,
        day: nextDay,
        week: nextWeek,
        energy: current.maxEnergy,
        error: undefined,
      }

      const withPassives = applyDailyPassives(updated)

      const rng = rngRef.current
      if (withPassives.day !== 1 && rng) {
        const roll = rng()
        if (roll < 0.35) {
          const event = pickEvent(withPassives, rng)
          if (event) {
            setPendingEvent(event)
          }
        }
      }

      return withPassives
    })
  }

  const handleUpgradePurchase = (id: string) => {
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
  }

  const handleNewRun = () => {
    clearSave()
    setState(createInitialState())
    setPendingEvent(null)
    setShowShop(false)
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
            onClick={() => handleAction(action.id)}
            disabled={Boolean(pendingEvent)}
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
            const level = state.meta?.upgrades?.[upgrade.id] ?? 0
            const maxLevel = upgrade.repeatable ? upgrade.maxLevel ?? Infinity : upgrade.maxLevel ?? 1
            const atMax = level >= maxLevel
            const cost = upgrade.cost
            return (
              <div key={upgrade.id} style={shopItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                  disabled={state.money < cost || atMax}
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
