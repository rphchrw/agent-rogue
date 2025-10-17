import type { CSSProperties } from 'react'

import type { GameEvent } from '../core/events'

type EventModalProps = {
  event: GameEvent
  onChoose: (choiceId: string) => void
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 20,
}

const modalStyle: CSSProperties = {
  backgroundColor: '#fff',
  maxWidth: 320,
  width: '100%',
  padding: 16,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
}

const choicesStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const buttonStyle: CSSProperties = {
  padding: '8px 12px',
}

const EventModal = ({ event, onChoose }: EventModalProps) => {
  return (
    <div style={overlayStyle} role="dialog" aria-modal>
      <div style={modalStyle}>
        <div>
          <h2 style={{ marginBottom: 4 }}>{event.title}</h2>
          <p style={{ margin: 0 }}>{event.text}</p>
        </div>
        <div style={choicesStyle}>
          {event.choices.map(choice => (
            <button
              key={choice.id}
              type="button"
              style={buttonStyle}
              onClick={() => onChoose(choice.id)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EventModal
