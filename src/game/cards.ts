import { Card } from './models';

type CardEffect = { id: string; description: string };
type CardKind = 'tactic' | 'event' | 'negotiation' | 'tool';

export type RegisteredCard = Card & {
  name: string;
  kind: CardKind;
  effects: CardEffect[];
};

const registry = new Map<string, RegisteredCard>();

const cloneEffect = (effect: CardEffect): CardEffect => ({ ...effect });
const cloneCard = (card: RegisteredCard): RegisteredCard => ({
  ...card,
  effects: card.effects.map(cloneEffect),
});

export const CardRegistry = {
  register(card: RegisteredCard): void {
    registry.set(card.id, cloneCard(card));
  },
  get(id: string): RegisteredCard | undefined {
    const card = registry.get(id);
    return card ? cloneCard(card) : undefined;
  },
  all(): RegisteredCard[] {
    return Array.from(registry.values()).map(cloneCard);
  },
};

const createCard = (card: RegisteredCard): RegisteredCard => {
  CardRegistry.register(card);
  return cloneCard(card);
};

export const starterDeck = (): RegisteredCard[] => [
  createCard({
    id: 'tactic-001',
    name: 'Swift Strike',
    kind: 'tactic',
    effects: [{ id: 'noop', description: 'Placeholder effect' }],
  }),
  createCard({
    id: 'tactic-002',
    name: 'Shadow Feint',
    kind: 'tactic',
    effects: [{ id: 'noop', description: 'Placeholder effect' }],
  }),
  createCard({
    id: 'event-001',
    name: 'Flash Intel',
    kind: 'event',
    effects: [{ id: 'noop', description: 'Placeholder effect' }],
  }),
  createCard({
    id: 'event-002',
    name: 'Quiet Tip',
    kind: 'event',
    effects: [{ id: 'noop', description: 'Placeholder effect' }],
  }),
  createCard({
    id: 'negotiation-001',
    name: 'Silver Tongue',
    kind: 'negotiation',
    effects: [{ id: 'noop', description: 'Placeholder effect' }],
  }),
  createCard({
    id: 'negotiation-002',
    name: 'Hard Bargain',
    kind: 'negotiation',
    effects: [{ id: 'noop', description: 'Placeholder effect' }],
  }),
  createCard({
    id: 'tool-001',
    name: 'Lockpick Set',
    kind: 'tool',
    effects: [{ id: 'noop', description: 'Placeholder effect' }],
  }),
  createCard({
    id: 'tool-002',
    name: 'Signal Scrambler',
    kind: 'tool',
    effects: [{ id: 'noop', description: 'Placeholder effect' }],
  }),
];

