import { CardRegistry, RegisteredCard } from './cards';
import { appendLog } from './engine';
import { GameState } from './models';

type CardEffect = RegisteredCard['effects'][number];

const findEffect = (card: RegisteredCard, effectId: string): CardEffect | undefined =>
  card.effects.find((effect) => effect.id === effectId);

const buildSummary = (card: RegisteredCard, effect: CardEffect | undefined): string => {
  const description = effect?.description ?? 'Unknown effect';
  return `Played ${card.name} — ${description} (no-op)`;
};

export function applyEffect(
  state: GameState,
  cardId: string,
  effectId: string,
): { state: GameState; summary: string } {
  const card = CardRegistry.get(cardId);

  if (!card) {
    const summary = `Played unknown card ${cardId} — Placeholder effect (no-op)`;
    return { state: appendLog(state, summary), summary };
  }

  const effect = findEffect(card, effectId);
  const summary = buildSummary(card, effect);
  const nextState = appendLog(state, summary);

  return { state: nextState, summary };
}

