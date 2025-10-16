import { useState } from 'react';
import { starterDeck } from '../game/cards';
import type { CardWithEffects } from '../game/cards';
import { applyEffect } from '../game/effects';
import { advancePhase, discard, draw, initGame } from '../game/engine';
import { GameState } from '../game/models';

const createNewGameState = (): GameState => {
  const baseState = initGame(Date.now());
  const deck = starterDeck();

  return {
    ...baseState,
    deck: [...deck],
    discard: [],
    hand: [],
  };
};

const drawForPhase = (state: GameState): GameState => {
  const afterDraw = draw(state, 5);
  return {
    ...afterDraw,
    phase: 'main',
  };
};

const GameScreen = () => {
  const [state, setState] = useState<GameState>(() => createNewGameState());

  const handleNewGame = () => {
    setState(createNewGameState());
  };

  const handleAdvancePhase = () => {
    setState((current) => {
      if (current.phase === 'draw') {
        return drawForPhase(current);
      }

      const advanced = advancePhase(current);

      if (advanced.phase === 'draw') {
        return drawForPhase(advanced);
      }

      return advanced;
    });
  };

  const handlePlayCard = (card: CardWithEffects) => {
    const firstEffect = card.effects?.[0];

    setState((current) => {
      let nextState = current;

      if (firstEffect) {
        const effectResult = applyEffect(nextState, card.id, firstEffect.id);
        nextState = effectResult.state;
      }

      return discard(nextState, card.id);
    });
  };

  return (
    <div>
      <h1>Agent Rogue</h1>
      <div>
        <button type="button" onClick={handleNewGame}>
          New Game
        </button>
        <button type="button" onClick={handleAdvancePhase}>
          Advance Phase
        </button>
      </div>

      <section>
        <h2>Day {state.day}</h2>
        <p>Phase: {state.phase}</p>
        <p>Money: {state.money}</p>
        <p>Reputation: {state.reputation}</p>
        <p>Deck: {state.deck.length}</p>
        <p>Discard: {state.discard.length}</p>
      </section>

      <section>
        <h2>Hand</h2>
        {state.hand.length === 0 ? (
          <p>No cards in hand.</p>
        ) : (
          <ul>
            {state.hand.map((card) => {
              const cardWithEffects = card as CardWithEffects;
              return (
                <li key={card.id}>
                  <div>
                    <strong>{card.name ?? card.id}</strong>
                    <div>Kind: {String(cardWithEffects.kind)}</div>
                    {cardWithEffects.effects?.length ? (
                      <ul>
                        {cardWithEffects.effects.map((effect) => (
                          <li key={effect.id}>{effect.description}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No effects.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePlayCard(cardWithEffects)}
                    disabled={!cardWithEffects.effects?.length}
                  >
                    Play
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2>Log</h2>
        <ul>
          {state.log.map((entry) => (
            <li key={entry.ts}>{entry.text}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default GameScreen;
