import { useCallback, useState } from 'react'

import { ACTIONS, resolveAction, type ActionId, type Stats } from '../core/actions'

export interface UsePlayerStatsOpts {
  onAfterAction?: (payload: { id: ActionId; ok: boolean; before: Stats; after: Stats }) => void
}

export function usePlayerStats(opts: UsePlayerStatsOpts = {}) {
  const { onAfterAction } = opts
  const [stats, setStats] = useState<Stats>({ energy: 80, morale: 50, cash: 100 })
  const [lastResult, setLastResult] = useState<ReturnType<typeof resolveAction> & { id: ActionId } | null>(null)

  const doAction = useCallback(
    (id: ActionId) => {
      const def = ACTIONS[id]
      const res = resolveAction(stats, def)

      if (res.ok) {
        setStats(res.after)
      }

      const detailed = { id, ...res }
      setLastResult(detailed)
      onAfterAction?.({ id, ok: res.ok, before: res.before, after: res.after })

      return res
    },
    [onAfterAction, stats],
  )

  return { stats, setStats, lastResult, doAction, actions: ACTIONS }
}
