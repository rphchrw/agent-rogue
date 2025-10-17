import { ACTIONS, resolveAction, type ActionId, type Delta, type Stats } from '../core/actions'

interface ActionsPanelProps {
  stats: Stats
  onDoAction: (id: ActionId) => void
  disabled?: boolean
}

const formatDelta = (delta: Delta) =>
  Object.entries(delta)
    .map(([key, value]) => (value ? `${key} ${value}` : ''))
    .filter(Boolean)
    .join(', ') || 'none'

const ActionsPanel = ({ stats, onDoAction, disabled }: ActionsPanelProps) => (
  <div className="actions-panel" data-testid="actions-panel">
    {Object.values(ACTIONS).map(def => {
      const sim = resolveAction(stats, def)
      const isDisabled = Boolean(disabled) || !sim.ok
      const title = `${def.label} | costs: ${formatDelta(def.costs)} · effects: ${formatDelta(def.effects)}`

      return (
        <button
          key={def.id}
          type="button"
          title={title}
          aria-label={`Do ${def.label}`}
          data-testid={`btn-${def.id.toLowerCase()}`}
          disabled={isDisabled}
          onClick={() => onDoAction(def.id)}
          className="btn"
        >
          {def.label}
        </button>
      )
    })}
  </div>
)

export default ActionsPanel
