import { useEffect, useRef, useState } from 'react'

import { applyAction, type GameAction, type GameState } from './core/engine'
import { pickEvent, type GameEvent } from './core/events'
import EventModal from './ui/EventModal'
import { createRng } from './core/rng'
import { UPGRADES, applyDailyPassives, applyUpgrade } from './core/upgrades'
import { clearSave, loadState, saveState } from './core/save'
import { GoalManager } from './systems/goals/GoalManager'
import { MilestoneManager } from './systems/goals/MilestoneManager'
import { EXAMPLE_GOALS, EXAMPLE_MILESTONES } from './systems/goals/sampleData'

const initialiseProgression = (state: GameState): GameState => {
  const goalManager = GoalManager.fromGameState(state)
  goalManager.seedGoals(EXAMPLE_GOALS)
  let result = goalManager.applyToGameState(state)

  const milestoneManager = MilestoneManager.fromGameState(result)
  milestoneManager.seedMilestones(EXAMPLE_MILESTONES)
  result = milestoneManager.applyToGameState(result)

  return result
}

const createInitialState = (): GameState =>
  initialiseProgression({
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

const infoPanelStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const panelHeadingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
}

const goalListStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const goalItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const goalMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#555',
}

const placeholderTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#777',
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
      setState(initialiseProgression(restored))
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
    setState(current => {
      const afterAction = applyAction(current, action)

      if (afterAction === current) {
        return current
      }

      const goalManager = GoalManager.fromGameState(afterAction)
      goalManager.seedGoals(EXAMPLE_GOALS)

      const progressNotes: string[] = []
      const moneyDelta = afterAction.money - current.money
      if (moneyDelta > 0) {
        const updatedWeekly = goalManager.updateGoalProgress('weekly-earn-money', moneyDelta)
        if (updatedWeekly) {
          progressNotes.push(
            `${updatedWeekly.title}: ${Math.min(updatedWeekly.progress, updatedWeekly.target)} / ${updatedWeekly.target}`,
          )
        }
      }

      const storyGoal = goalManager.getGoalById('story-first-client')
      if (storyGoal && !storyGoal.completed && storyGoal.progress < storyGoal.target) {
        if (afterAction.skill >= 4 && afterAction.money >= 20) {
          const updatedStory = goalManager.updateGoalProgress('story-first-client', 1)
          if (updatedStory) {
            progressNotes.push(
              `${updatedStory.title}: ${Math.min(updatedStory.progress, updatedStory.target)} / ${updatedStory.target}`,
            )
          }
        }
      }

      if (progressNotes.length > 0) {
        console.log('[Goals] Progress update:', progressNotes.join(' | '))
      }

      const newlyCompleted = goalManager.checkCompletion()
      if (newlyCompleted.length > 0) {
        console.log('[Goals] Completed:', newlyCompleted.map(goal => goal.title).join(', '))
      }

      const goalsState = goalManager.getState()
      let updated = goalManager.applyToGameState(afterAction)

      const milestoneManager = MilestoneManager.fromGameState(updated)
      milestoneManager.seedMilestones(EXAMPLE_MILESTONES)
      const unlocked = milestoneManager.evaluateFromGoals(goalsState)
      if (unlocked.length > 0) {
        console.log('[Milestones] Unlocked:', unlocked.map(entry => entry.title).join(', '))
      }

      updated = milestoneManager.applyToGameState(updated)

      return updated
    })
  }

  const handleNextDay = () => {
    setState(current => {
      let nextDay = current.day + 1
      let nextWeek = current.week

      if (nextDay > 7) {
        nextDay = 1
        nextWeek += 1
      }

      let updated: GameState = {
        ...current,
        day: nextDay,
        week: nextWeek,
        energy: current.maxEnergy,
        error: undefined,
      }

      updated = applyDailyPassives(updated)

      const goalManager = GoalManager.fromGameState(updated)
      goalManager.seedGoals(EXAMPLE_GOALS)

      const progressLogs: string[] = []
      const snapshot = goalManager.getState()
      for (const goal of snapshot.active) {
        if (goal.type === 'daily' && !goal.completed) {
          const updatedGoal = goalManager.updateGoalProgress(goal.id, 1)
          if (updatedGoal) {
            progressLogs.push(
              `${updatedGoal.title}: ${Math.min(updatedGoal.progress, updatedGoal.target)} / ${updatedGoal.target}`,
            )
          }
        }
      }

      if (progressLogs.length > 0) {
        console.log('[Goals] Daily progress after advancing day:', progressLogs.join(' | '))
      }

      const newlyCompleted = goalManager.checkCompletion()
      if (newlyCompleted.length > 0) {
        console.log(
          '[Goals] Completed:',
          newlyCompleted.map(goal => goal.title).join(', '),
        )
      }

      const goalsState = goalManager.getState()
      updated = goalManager.applyToGameState(updated)

      const milestoneManager = MilestoneManager.fromGameState(updated)
      milestoneManager.seedMilestones(EXAMPLE_MILESTONES)
      const unlocked = milestoneManager.evaluateFromGoals(goalsState)
      if (unlocked.length > 0) {
        console.log(
          '[Milestones] Unlocked:',
          unlocked.map(entry => entry.title).join(', '),
        )
      }

      updated = milestoneManager.applyToGameState(updated)

      const rng = rngRef.current
      if (updated.day !== 1 && rng) {
        const roll = rng()
        if (roll < 0.35) {
          const event = pickEvent(updated, rng)
          if (event) {
            setPendingEvent(event)
          }
        }
      }

      return updated
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
      setState(initialiseProgression(restored))
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

  const goalsState = state.meta?.goals ?? { active: [], completed: [] }
  const activeGoals = goalsState.active ?? []
  const completedGoals = goalsState.completed ?? []
  const milestoneEntries = state.meta?.milestones?.entries ?? []

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

      <div style={infoPanelStyle}>
        <h2 style={panelHeadingStyle}>Goals</h2>
        {activeGoals.length > 0 ? (
          <ul style={goalListStyle}>
            {activeGoals.map(goal => (
              <li key={goal.id} style={goalItemStyle}>
                <strong>{goal.title}</strong>
                <span style={goalMetaStyle}>{goal.description}</span>
                <span style={goalMetaStyle}>
                  Progress: {Math.min(goal.progress, goal.target)} / {goal.target}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={placeholderTextStyle}>No active goals yet.</p>
        )}
        {completedGoals.length > 0 ? (
          <details>
            <summary style={{ cursor: 'pointer', fontSize: 12 }}>
              Completed goals ({completedGoals.length})
            </summary>
            <ul style={goalListStyle}>
              {completedGoals.map(goal => (
                <li key={goal.id} style={goalItemStyle}>
                  <strong>{goal.title}</strong>
                  <span style={goalMetaStyle}>Finished and archived.</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      <div style={infoPanelStyle}>
        <h2 style={panelHeadingStyle}>Milestones</h2>
        {milestoneEntries.length > 0 ? (
          <ul style={goalListStyle}>
            {milestoneEntries.map(milestone => (
              <li key={milestone.id} style={goalItemStyle}>
                <strong>{milestone.title}</strong>
                <span style={goalMetaStyle}>{milestone.description}</span>
                <span style={goalMetaStyle}>
                  Status: {milestone.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={placeholderTextStyle}>No milestones tracked yet.</p>
        )}
      </div>

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
