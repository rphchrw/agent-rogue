import { useCallback, useState } from 'react'

import ActionsPanel from './components/ActionsPanel'
import { usePlayerStats, type UsePlayerStatsOpts } from './hooks/usePlayerStats'
import { usePhaseManager } from './hooks/usePhaseManager'
import type { ActionId } from './core/actions'

const LOCK_DELAY_MS = 200

const App = () => {
  const { phase, day, week, started, startDay, endPhase } = usePhaseManager({ autoStart: false })
  const handleAfterAction = useCallback<NonNullable<UsePlayerStatsOpts['onAfterAction']>>(
    ({ ok }) => {
      if (ok) {
        endPhase()
      }
    },
    [endPhase],
  )
  const { stats, doAction, lastResult } = usePlayerStats({ onAfterAction: handleAfterAction })
  const [lock, setLock] = useState(false)

  const handleDoAction = useCallback(
    (id: ActionId) => {
      if (lock) {
        return undefined
      }

      setLock(true)
      const result = doAction(id)
      window.setTimeout(() => setLock(false), LOCK_DELAY_MS)

      return result
    },
    [doAction, lock],
  )

  if (!started) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Agent Rogue</h1>
        <button type="button" onClick={startDay} data-testid="btn-start-day">
          Start Day
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <div data-testid="hud">
        Day {day} · Week {week} · Phase: {phase ?? '—'}
      </div>
      <div style={{ margin: '8px 0' }}>
        Energy {stats.energy} · Morale {stats.morale} · Cash ${stats.cash}
      </div>
      <ActionsPanel stats={stats} onDoAction={handleDoAction} disabled={lock} />
      {lastResult ? (
        <div data-testid="last-result" style={{ opacity: 0.8, marginTop: 8 }}>
          Last: {lastResult.id} — {lastResult.ok ? 'OK' : 'Blocked'}
        </div>
      ) : null}
    </div>
  )
}

export default App
