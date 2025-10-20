import { useEffect, useRef, useState } from 'react'

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
import { UPGRADES, applyDailyPassives, applyUpgrade } from './core/upgrades'
import { clearSave, loadState, saveState } from './core/save'

// Single source of truth for initial state
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
    // If your GameState already includes these, keep them.
    // If not, delete the 'counters' and 'goalsCompleted' keys below or update the type.
    counters: {
      trainsThisWeek: 0,
      daysFullEnergy: 0,
      zeroMoneyStreak: 0,
      lowMoraleStreak: 0,
    },
    goalsCompleted: [],
  },
})

// Back-compat alias for code that expects createInitialGameState
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

// --- Shop styles from main (keep) ---
const shopToggleStyle: React.CSSProperties = {
  ...buttonStyle,
  alignSelf: 'flex-start',
};

const shopPanelStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const shopItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  borderBottom: '1px solid #eee',
  paddingBottom: 8,
};

// --- Unified actions list ---
const actions: { id: GameAction; label: string }[] = [
  { id: 'TRAIN', label: 'Train' },
  { id: 'WORK',  label: 'Work' },
  { id: 'REST',  label: 'Rest' },
];

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
const [state, setState] = useState<GameState>(() => createInitialState());

  const [pendingEvent, setPendingEvent] = useState<GameEvent | null>(null)
  const [showShop, setShowShop] = useState(false)
  const rngRef = useRef<(() => number) | null>(null)

  if (!rngRef.current) {
    rngRef.current = createRng(Date.now())
  }

// Restore from localStorage on mount
useEffect(() => {
  const restored = loadState();
  if (restored) {
    setState(restored);
    setPendingEvent(null);
    setShowShop(false);
  }
}, []);

// Autosave (debounced)
useEffect(() => {
  if (typeof window === 'undefined') return;
  const timeout = window.setTimeout(() => {
    saveState(state);
  }, 300);
  return () => window.clearTimeout(timeout);
}, [state]);

// Unified action handler (use main's type/signature)
const handleAction = (action: GameAction) => {
  setState(current => applyAction(current, action));
};

// If other code still uses GameActionType, keep a back-compat alias:
type GameActionType = GameAction;

  }

  const handleNextDay = () => {
    let nextEvent: GameEvent | null = null
    setState(current => {
// Advance the day via engine (handles passives, counters, goals, win/lose checks)
const advanced = advanceDay(current);

// If you have win/lose logic, keep it here
const outcome = getOutcome(advanced);

// Only roll events if the run is still ongoing
if (outcome.status === 'ongoing') {
  const rng = rngRef.current;
  if (advanced.day !== 1 && rng) {
    const roll = rng();
    if (roll < 0.35) {
      const event = pickEvent(advanced, rng);
      if (event) {
        setPendingEvent(event); // show the modal
      }
    }
  }
}

return advanced;

    })

    if (nextEvent) {
      setPendingEvent(nextEvent)
    }
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

// --- Persistence + run controls ---
const handleSaveNow = () => {
  saveState(state);
};

const handleLoad = () => {
  const restored = loadState();
  if (restored) {
    setState(restored);
  } else {
    setState(createInitialState());
  }
  // reset run context
  rngRef.current = createRng(Date.now());
  setPendingEvent(null);
  setShowShop(false);
};

const handleNewRun = () => {
  clearSave();
  rngRef.current = createRng(Date.now());
  setState(createInitialState());
  setPendingEvent(null);
  setShowShop(false);
};

// Back-compat for older code paths
const handleRestart = () => handleNewRun();

// --- Outcome / milestones UI text ---
const outcome = getOutcome(state);
const isGameOver = outcome.status !== 'ongoing';
const milestoneProgress = `${state.meta?.goalsCompleted?.length ?? 0}/${GOAL_TARGET}`;

const outcomeMessage =
  outcome.status === 'won'
    ? `You completed ${milestoneProgress} milestones!`
    : outcome.status === 'lost'
      ? `Mission failed: ${
          outcome.loseReason === 'morale'
            ? `Morale hit zero for ${LOSS_CONDITIONS.moraleZeroDays} days.`
            : `Money stayed at zero for ${LOSS_CONDITIONS.moneyZeroDays} days.`
        }`
      : '';


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
            disabled={Boolean(pendingEvent) || isGameOver}
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
