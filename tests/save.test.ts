import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearSave, loadState, saveState } from '../src/core/save'
import { extractSave, SAVE_KEY } from '../src/systems/save/serialize'
import type { GameState } from '../src/core/engine'

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

  const expectStableSnapshot = (original: GameState, restored: GameState | null) => {
    expect(restored).not.toBeNull()

    if (!restored) {
      return
    }

    const expected = extractSave(original)
    const actual = extractSave(restored)

    try {
      expect(actual).toEqual(expected)
    } catch (error) {
      if (process.env.NODE_ENV === 'test') {
        const keys = Array.from(
          new Set<string>([...Object.keys(expected), ...Object.keys(actual)]),
        ).sort()
        console.log('[save-test] stable snapshot diff detected:')
        for (const key of keys) {
          const exp = JSON.stringify((expected as any)[key])
          const act = JSON.stringify((actual as any)[key])
          if (exp !== act) {
            console.log(`  ${key}: expected=${exp} actual=${act}`)
          }
        }
      }

      throw error
    }
  }

  it('persists and restores game state', () => {
    const state: GameState = {
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
          energyCostReduction: 1,
        },
      },
    }

    saveState(state)
    const loaded = loadState()

    expectStableSnapshot(state, loaded)
  })

  it('returns null when saved data is corrupted', () => {
    const storage = globalThis.localStorage as MockStorage
    storage.setItem(SAVE_KEY, '{not-valid')

    expect(loadState()).toBeNull()
  })

  it('returns null when saved data shape is invalid', () => {
    const storage = globalThis.localStorage as MockStorage
    storage.setItem(SAVE_KEY, JSON.stringify({ foo: 'bar' }))

    expect(loadState()).toBeNull()
  })

  it('clamps negative energy values from tampered saves', () => {
    const storage = globalThis.localStorage as MockStorage
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        day: 1,
        week: 1,
        energy: -10,
        maxEnergy: -5,
        morale: 3,
        skill: 2,
        money: 5,
        meta: {
          upgrades: {},
          effects: {},
        },
      }),
    )

    const loaded = loadState()

    expect(loaded).not.toBeNull()
    expect(loaded?.maxEnergy).toBe(1)
    expect(loaded?.energy).toBe(0)
  })
})
