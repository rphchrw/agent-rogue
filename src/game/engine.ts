import { Card, GameState, Phase } from './models';
import { shuffle } from './util';

const DRAW_PHASE_COUNT = 3;
const NEXT_PHASE: Record<Phase, Phase> = {
  draw: 'main',
  main: 'resolve',
  resolve: 'end',
  end: 'upkeep',
  upkeep: 'draw',
};

const sanitizeCount = (count: number): number =>
  Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;

const createLogEntry = (text: string) => ({ ts: Date.now(), text });

const removeFirstMatchingCard = (
  hand: readonly Card[],
  cardId: string,
): { removed?: Card; remaining: Card[] } => {
  let removed: Card | undefined;
  const remaining: Card[] = [];

  for (const card of hand) {
    if (!removed && card.id === cardId) {
      removed = card;
    } else {
      remaining.push(card);
    }
  }

  return { removed, remaining };
};

const refillDeckIfNeeded = (
  deck: Card[],
  discardPile: Card[],
  seed: number,
): { deck: Card[]; discardPile: Card[]; seed: number } => {
  if (deck.length > 0 || discardPile.length === 0) {
    return { deck, discardPile, seed };
  }

  const { items, seed: nextSeed } = shuffle(discardPile, seed);

  return {
    deck: [...items],
    discardPile: [],
    seed: nextSeed,
  };
};

const enterDrawPhase = (state: GameState): GameState => {
  const afterDraw = draw(state, DRAW_PHASE_COUNT);
  return {
    ...afterDraw,
    phase: 'main',
  };
};

/** Initializes a new game state with default values. */
export function initGame(seed: number): GameState {
  return {
    day: 1,
    week: 1,
    money: 1000,
    reputation: 0,
    seed,
    phase: 'draw',
    deck: [],
    discard: [],
    hand: [],
    clients: [],
    activeProperty: undefined,
    log: [
      createLogEntry('Welcome to Agent Rogue.'),
    ],
  };
}

/** Appends a log entry to the provided game state. */
export function appendLog(state: GameState, text: string): GameState {
  return {
    ...state,
    log: [
      ...state.log,
      createLogEntry(text),
    ],
  };
}

/** Computes the current week from a given day number. */
export function computeWeek(day: number): number {
  return Math.floor((day - 1) / 7) + 1;
}

/** Draws up to the requested number of cards into the hand. */
export function draw(state: GameState, count: number): GameState {
  const desired = sanitizeCount(count);
  let remaining = desired;
  let deck = [...state.deck];
  let discardPile = [...state.discard];
  let seed = state.seed;
  const drawnCards: Card[] = [];

  while (remaining > 0) {
    ({ deck, discardPile, seed } = refillDeckIfNeeded(deck, discardPile, seed));

    if (deck.length === 0) {
      break;
    }

    const [nextCard, ...restDeck] = deck;
    deck = restDeck;
    drawnCards.push(nextCard);
    remaining -= 1;
  }

  return {
    ...state,
    deck,
    discard: discardPile,
    hand: [...state.hand, ...drawnCards],
    seed,
  };
}

/** Moves the specified card from the hand to the discard pile. */
export function discard(state: GameState, cardId: string): GameState {
  const { removed, remaining } = removeFirstMatchingCard(state.hand, cardId);
  const discardPile = removed ? [removed, ...state.discard] : [...state.discard];

  return {
    ...state,
    hand: remaining,
    discard: discardPile,
  };
}

/** Advances the game to the next day and resets the phase. */
export function nextDay(state: GameState): GameState {
  const nextDayNumber = state.day + 1;
  const baseState: GameState = {
    ...state,
    day: nextDayNumber,
    week: computeWeek(nextDayNumber),
    phase: 'draw',
  };

  return appendLog(baseState, `Day ${nextDayNumber} begins.`);
}

/** Moves the game forward to the next phase in the loop. */
export function advancePhase(state: GameState): GameState {
  if (state.phase === 'draw') {
    return enterDrawPhase(state);
  }

  const nextPhase = NEXT_PHASE[state.phase];

  if (nextPhase === 'draw') {
    return enterDrawPhase(state);
  }

  return {
    ...state,
    phase: nextPhase,
  };
}
