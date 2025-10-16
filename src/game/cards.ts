import { Card } from './models';

type CardEffect = { id: string; description: string };

type CardKind = 'tactic' | 'event' | 'negotiation' | 'tool';

interface CardWithEffects extends Card {
  kind: CardKind;
  effects: CardEffect[];
}

const registry = new Map<string, CardWithEffects>();

export const CardRegistry = {
  register(card: CardWithEffects): void {
    registry.set(card.id, { ...card });
  },
  get(id: string): CardWithEffects | undefined {
    const card = registry.get(id);
    return card ? { ...card, effects: card.effects.map((effect) => ({ ...effect })) } : undefined;
  },
  all(): CardWithEffects[] {
    return Array.from(registry.values()).map((card) => ({
      ...card,
      effects: card.effects.map((effect) => ({ ...effect })),
    }));
  },
};

const createCard = (card: CardWithEffects): CardWithEffects => {
  CardRegistry.register(card);
  return card;
};

export const starterDeck = (): CardWithEffects[] => [
  createCard({
    id: 'tactic-001',
    name: 'Momentum Push',
    kind: 'tactic',
    effects: [
      {
        id: 'tactic-001-effect-1',
        description: 'Gain a burst of momentum (placeholder).',
      },
    ],
  }),
  createCard({
    id: 'event-001',
    name: 'Unexpected Opportunity',
    kind: 'event',
    effects: [
      {
        id: 'event-001-effect-1',
        description: 'An opportunity appears out of nowhere (placeholder).',
      },
    ],
  }),
  createCard({
    id: 'negotiation-001',
    name: 'Smooth Talk',
    kind: 'negotiation',
    effects: [
      {
        id: 'negotiation-001-effect-1',
        description: 'Charm the client with practiced lines (placeholder).',
      },
    ],
  }),
  createCard({
    id: 'tool-001',
    name: 'Gadget Kit',
    kind: 'tool',
    effects: [
      {
        id: 'tool-001-effect-1',
        description: 'Deploy a useful gadget from the kit (placeholder).',
      },
    ],
  }),
  createCard({
    id: 'tactic-002',
    name: 'Calculated Risk',
    kind: 'tactic',
    effects: [
      {
        id: 'tactic-002-effect-1',
        description: 'Take a calculated risk to push forward (placeholder).',
      },
    ],
  }),
  createCard({
    id: 'event-002',
    name: 'Inside Tip',
    kind: 'event',
    effects: [
      {
        id: 'event-002-effect-1',
        description: 'Receive an insider tip from a contact (placeholder).',
      },
    ],
  }),
];

export type { CardWithEffects, CardEffect, CardKind };
