import { useState } from 'react'

import { advancePhase, initGame, nextDay } from '../game/engine'
import type { GameState } from '../game/models'

const createInitialState = (): GameState => initGame(Date.now())

const GameScreen = () => {
  const [state, setState] = useState<GameState>(() => createInitialState())

  const handleAdvancePhase = () => {
    setState((current) => advancePhase(current))
  }

  const handleNextDay = () => {
    setState((current) => nextDay(current))
  }

  const handleNewGame = () => {
    setState(createInitialState())
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
