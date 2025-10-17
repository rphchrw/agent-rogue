import { type CSSProperties, useMemo, useState } from 'react'

import { applyAction, type GameAction, type GameState } from './core/engine'

const INITIAL_STATE: GameState = {
  day: 1,
  week: 1,
  energy: 10,
  morale: 50,
  skill: 0,
  money: 100,
}

const ACTIONS: { id: GameAction; label: string; description: string }[] = [
  { id: 'Train', label: 'Train', description: 'Spend energy to increase skill and morale.' },
  { id: 'Work', label: 'Work', description: 'Earn money with a small morale hit.' },
  { id: 'Rest', label: 'Rest', description: 'Recover energy and morale.' },
]

const containerStyle: CSSProperties = {
  maxWidth: 480,
  margin: '40px auto',
  padding: '24px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.08)',
  color: '#f5f5f5',
  boxShadow: '0 12px 35px rgba(15, 23, 42, 0.4)',
  backdropFilter: 'blur(12px)',
}

const headingStyle: CSSProperties = {
  margin: '0 0 16px',
  textAlign: 'center',
}

const sectionHeadingStyle: CSSProperties = {
  fontSize: '1.125rem',
  margin: '0 0 12px',
}

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '12px',
  marginBottom: '24px',
}

const statCardStyle: CSSProperties = {
  padding: '12px 16px',
  borderRadius: '10px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
}

const statLabelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(148, 163, 184, 0.9)',
  marginBottom: 4,
}

const statValueStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
}

const actionsRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '24px',
}

const buttonStyle: CSSProperties = {
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  background: 'rgba(59, 130, 246, 0.15)',
  color: '#e2e8f0',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.2s ease, transform 0.2s ease',
}

const nextDayButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'rgba(34, 197, 94, 0.2)',
  borderColor: 'rgba(34, 197, 94, 0.35)',
  textAlign: 'center',
}

const Game = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE)

  const stats = useMemo(
    () => [
      { label: 'Day', value: state.day },
      { label: 'Week', value: state.week },
      { label: 'Energy', value: state.energy },
      { label: 'Morale', value: state.morale },
      { label: 'Skill', value: state.skill },
      { label: 'Money', value: `$${state.money}` },
    ],
    [state.day, state.money, state.morale, state.skill, state.week, state.energy],
  )

  const handleAction = (action: GameAction) => {
    setState(current => applyAction(current, action))
  }

  const handleNextDay = () => {
    setState(current => {
      const nextDay = current.day + 1
      const nextWeek = Math.floor((nextDay - 1) / 7) + 1

      return {
        ...current,
        day: nextDay,
        week: nextWeek,
        energy: 10,
      }
    })
  }

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Agent Rogue</h1>

      <section>
        <h2 style={sectionHeadingStyle}>Player Stats</h2>
        <div style={statsGridStyle}>
          {stats.map(stat => (
            <div key={stat.label} style={statCardStyle}>
              <span style={statLabelStyle}>{stat.label}</span>
              <span style={statValueStyle}>{stat.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={sectionHeadingStyle}>Actions</h2>
        <div style={actionsRowStyle}>
          {ACTIONS.map(action => (
            <button
              key={action.id}
              type="button"
              style={buttonStyle}
              onClick={() => handleAction(action.id)}
            >
              <strong>{action.label}</strong>
              <div style={{ fontSize: '0.85rem', fontWeight: 400, opacity: 0.85 }}>{action.description}</div>
            </button>
          ))}
        </div>
      </section>

      <button type="button" style={nextDayButtonStyle} onClick={handleNextDay}>
        Next Day
      </button>
    </div>
  )
}

export default Game
