import type { Phase } from '../core/phaseMachine'

interface StatusHUDProps {
  day: number
  week: number
  phase: Phase | null
}

const StatusHUD = ({ day, week, phase }: StatusHUDProps) => (
  <div className="status-hud">
    <span>Day {day}</span>
    <span> · </span>
    <span>Week {week}</span>
    <span> · </span>
    <span>Phase: {phase ?? '—'}</span>
  </div>
)

export default StatusHUD
