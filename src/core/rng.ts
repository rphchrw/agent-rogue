export interface RngState {
  seed: number
}

export const seedRng = (state: RngState, seed: number) => {
  state.seed = seed >>> 0
}

export const next = (state: RngState): number => {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0
  return state.seed / 0x100000000
}

export const createRng = (seed: number): (() => number) => {
  const state: RngState = { seed: 0 }
  seedRng(state, seed)
  return () => next(state)
}
