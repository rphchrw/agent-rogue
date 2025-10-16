import { appendLog } from './engine';
import { Card, GameState } from './models';
import { CardRegistry } from './cards';

type CardWithEffects = Card & {
  effects?: { id: string; description: string }[];
};

const findEffect = (
  card: CardWithEffects | undefined,
  effectId: string,
): { id: string; description: string } | undefined =>
  card?.effects?.find((effect) => effect.id === effectId);

const getEffectSummary = (
  card: CardWithEffects | undefined,
  effectId: string,
): { cardLabel: string; effectDescription: string } => {
  const cardLabel = card?.name ?? card?.id ?? effectId;
  const effect = findEffect(card, effectId);
  const effectDescription = effect?.description ?? 'No effect description available.';

  return { cardLabel, effectDescription };
};

export const applyEffect = (
  state: GameState,
  cardId: string,
  effectId: string,
): { state: GameState; summary: string } => {
  const card = CardRegistry.get(cardId) as CardWithEffects | undefined;
  const { cardLabel, effectDescription } = getEffectSummary(card, effectId);
  const summary = `Played ${cardLabel} — ${effectDescription} (no-op).`;

  return {
    state: appendLog(state, summary),
    summary,
  };
};
