const LCG_A = 1664525;
const LCG_C = 1013904223;
const LCG_M = 2 ** 32;

const nextSeed = (seed: number): number => (LCG_A * seed + LCG_C) % LCG_M;

export interface ShuffleResult<T> {
  items: T[];
  seed: number;
}

export const shuffle = <T>(items: readonly T[], seed: number): ShuffleResult<T> => {
  const result = [...items];
  let currentSeed = seed;

  for (let i = result.length - 1; i > 0; i -= 1) {
    currentSeed = nextSeed(currentSeed);
    const j = currentSeed % (i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return {
    items: result,
    seed: nextSeed(currentSeed),
  };
};
