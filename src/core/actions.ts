export type StatKey = "energy" | "morale" | "cash";

export interface Stats {
  energy: number;
  morale: number;
  cash: number;
}

export type ActionId = "Train" | "Scout" | "Rest" | "Upgrade";

export interface Delta {
  energy?: number;
  morale?: number;
  cash?: number;
}

export interface ActionDef {
  id: ActionId;
  label: string;
  costs: Delta;   // negative deltas paid up front
  effects: Delta; // applied after costs
}

export const ACTIONS: Record<ActionId, ActionDef> = {
  Train: {
    id: "Train",
    label: "Train",
    costs: { energy: -20, cash: 0 },
    effects: { morale: +5 },
  },
  Scout: {
    id: "Scout",
    label: "Scout",
    costs: { energy: -15, cash: -5 },
    effects: { morale: +3 },
  },
  Rest: {
    id: "Rest",
    label: "Rest",
    costs: {},
    effects: { energy: +25, morale: +2 },
  },
  Upgrade: {
    id: "Upgrade",
    label: "Upgrade",
    costs: { cash: -30, energy: -5 },
    effects: { morale: +8 },
  },
};

export function clampStats(s: Stats): Stats {
  return {
    energy: Math.max(0, Math.min(100, s.energy)),
    morale: Math.max(0, Math.min(100, s.morale)),
    cash: Math.max(0, s.cash),
  };
}

export function applyDelta(s: Stats, d: Delta): Stats {
  return {
    energy: s.energy + (d.energy ?? 0),
    morale: s.morale + (d.morale ?? 0),
    cash: s.cash + (d.cash ?? 0),
  };
}

export function canAfford(s: Stats, costs: Delta): boolean {
  const post = applyDelta(s, costs);
  return post.energy >= 0 && post.cash >= 0; // morale clamp happens after effects
}

/** Pure: returns {ok, before, after, applied} without side effects */
export function resolveAction(
  s: Stats,
  def: ActionDef
): { ok: boolean; before: Stats; after: Stats; applied: Delta } {
  const before = { ...s };
  if (!canAfford(s, def.costs)) return { ok: false, before, after: s, applied: {} };
  const mid = applyDelta(s, def.costs);
  const after = clampStats(applyDelta(mid, def.effects));
  return { ok: true, before, after, applied: { ...def.costs, ...def.effects } };
}