interface PhaseControlsProps {
  onEndPhase: () => void
  onEndDay: () => void
  disabled?: boolean
}

const PhaseControls = ({ onEndPhase, onEndDay, disabled = false }: PhaseControlsProps) => (
  <div className="phase-controls">
    <button type="button" onClick={onEndPhase} disabled={disabled}>
      End Phase
    </button>
    <button type="button" onClick={onEndDay} disabled={disabled}>
      End Day
    </button>
  </div>
)

export default PhaseControls
