export type Phase = 'draw' | 'main' | 'resolve' | 'end' | 'upkeep';

export interface LogEntry {
  ts: number;
  text: string;
}

export interface Card {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface Client {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface Property {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface GameState {
  day: number;
  week: number;
  money: number;
  reputation: number;
  seed: number;
  phase: Phase;
  deck: Card[];
  discard: Card[];
  hand: Card[];
  clients: Client[];
  activeProperty?: Property;
  log: LogEntry[];
}
