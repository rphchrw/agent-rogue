import { useEffect, useState } from 'react'

import { starterDeck } from '../game/cards'
import { advancePhase, discard, draw, initGame, nextDay } from '../game/engine'
import { applyEffect } from '../game/effects'
import type { Card, GameState } from '../game/models'

const createInitialState = (): GameState => {
  const base = initGame(Date.now())
  const deck = starterDeck()

  return {
    ...base,
    deck,
    hand: [] as Card[],
    discard: [] as Card[],
  }
}

const getPrimaryEffectId = (card: Card): string => {
  const candidate = card as Card & { effects?: { id?: string }[] }
  const [firstEffect] = Array.isArray(candidate.effects) ? candidate.effects : []
  return firstEffect?.id ?? 'noop'
}

const GameScreen = () => {
  const [state, setState] = useState<GameState>(createInitialState)

  useEffect(() => {
    if (state.phase === 'draw' && state.hand.length < 5) {
      setState((current) => {
        if (current.phase !== 'draw' || current.hand.length >= 5) {
          return current
        }

        return draw(current, 5)
      })
    }
  }, [state.phase, state.hand.length])

  const handleAdvancePhase = () => {
    setState((current) => advancePhase(current))
  }

  const handleNextDay = () => {
    setState((current) => nextDay(current))
  }

  const handleNewGame = () => {
    setState(createInitialState())
  }

  const handlePlayCard = (cardId: string) => {
    setState((current) => {
      const card = current.hand.find((item) => item.id === cardId)

      if (!card) {
        return current
      }

      const effectId = getPrimaryEffectId(card)
      const { state: afterEffect } = applyEffect(current, cardId, effectId)

      return discard(afterEffect, cardId)
    })
  }

  return (
    <div className="game-screen">
      <header>
        <h1>Agent Rogue</h1>
        <div className="game-screen__actions">
          <button type="button" onClick={handleNewGame}>
            New Game
          </button>
          <button type="button" onClick={handleAdvancePhase}>
            Advance Phase
          </button>
          <button type="button" onClick={handleNextDay}>
            Next Day
          </button>
        </div>
      </header>

      <section className="game-screen__stats">
        <h2>Stats</h2>
        <ul>
          <li>
            <strong>Day:</strong> {state.day}
          </li>
          <li>
            <strong>Week:</strong> {state.week}
          </li>
          <li>
            <strong>Phase:</strong> {state.phase}
          </li>
          <li>
            <strong>Money:</strong> {'$'}{state.money}
          </li>
          <li>
            <strong>Reputation:</strong> {state.reputation}
          </li>
        </ul>
      </section>

      <section className="game-screen__hand">
        <h2>Hand</h2>
        {state.hand.length === 0 ? (
          <p>Hand is empty.</p>
        ) : (
          <ul>
            {state.hand.map((card) => (
              <li key={card.id}>
                <span>{card.name ?? card.id}</span>{' '}
                <button type="button" onClick={() => handlePlayCard(card.id)}>
                  Play
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="game-screen__log">
        <h2>Log</h2>
        {state.log.length === 0 ? (
          <p>No log entries yet.</p>
        ) : (
          <ol>
            {state.log.map((entry) => (
              <li key={entry.ts}>{entry.text}</li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

export default GameScreen
