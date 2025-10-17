import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearSave, loadState, saveState } from '../src/core/save'
import { createInitialState, type GameState } from '../src/core/engine'

class MockStorage implements Storage {
  private store = new Map<string, string>()

  clear = vi.fn(() => {
    this.store.clear()
  })

  get length(): number {
    return this.store.size
  }

  getItem = vi.fn((key: string) => (this.store.has(key) ? this.store.get(key)! : null))

  key = vi.fn((index: number) => Array.from(this.store.keys())[index] ?? null)

  removeItem = vi.fn((key: string) => {
    this.store.delete(key)
  })

  setItem = vi.fn((key: string, value: string) => {
    this.store.set(key, value)
  })
}

describe('save system', () => {
  beforeEach(() => {
    const storage = new MockStorage()
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
      writable: true,
    })
    clearSave()
  })

  it('persists and restores game state', () => {
    const base = createInitialState()
    const state: GameState = {
      ...base,
      day: 3,
      week: 2,
      energy: 4,
      maxEnergy: 8,
      morale: 7,
      skill: 12,
      money: 25,
      meta: {
        upgrades: {
          booster: 2,
        },
        effects: {
          energyCostDelta: -1,
          dailyIncome: 3,
        },
        counters: {
          trainsThisWeek: 2,
          daysFullEnergy: 1,
          zeroMoneyStreak: 0,
          lowMoraleStreak: 0,
        },
        goalsCompleted: ['nest-egg'],
      },
    }

    saveState(state)
    const loaded = loadState()

    expect(loaded).toEqual({
      ...state,
      meta: {
        upgrades: {
          booster: 2,
        },
        effects: {
          energyCostDelta: -1,
          dailyIncome: 3,
        },
        counters: {
          trainsThisWeek: 2,
          daysFullEnergy: 1,
          zeroMoneyStreak: 0,
          lowMoraleStreak: 0,
        },
        goalsCompleted: ['nest-egg'],
      },
    })
  })

  it('returns null when saved data is corrupted', () => {
    const storage = globalThis.localStorage as MockStorage
    storage.setItem('agent-rogue', '{not-valid')

    expect(loadState()).toBeNull()
  })

  it('returns null when saved data shape is invalid', () => {
    const storage = globalThis.localStorage as MockStorage
    storage.setItem('agent-rogue', JSON.stringify({ foo: 'bar' }))

    expect(loadState()).toBeNull()
  })
})
