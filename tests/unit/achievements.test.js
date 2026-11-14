import { describe, it } from 'node:test'
import assert from 'node:assert'
import { GAME_BALANCE } from '../../src/game3d/config/gameBalance.js'
import achievementsData from '../../src/data/achievements.json' with { type: 'json' }

describe('Achievements System (P1-12)', () => {
  it('defines at least 12 structured achievements matching achievements.json', () => {
    assert.ok(GAME_BALANCE.ACHIEVEMENTS.length >= 12, 'Must have at least 12 achievements')
    assert.strictEqual(GAME_BALANCE.ACHIEVEMENTS.length, achievementsData.length)
    for (const ach of GAME_BALANCE.ACHIEVEMENTS) {
      assert.ok(ach.id, 'Achievement must have an id')
      assert.ok(ach.title, 'Achievement must have a title')
      assert.ok(ach.desc, 'Achievement must have a description')
      assert.ok(ach.icon, 'Achievement must have an icon')
      assert.strictEqual(typeof ach.condition, 'function', 'Achievement must have a condition function')
    }
  })

  it('verifies condition logic for all 12 achievements (unlocks when met, stays locked when unmet)', () => {
    const testCases = [
      {
        id: 'first_season',
        unmet: { seasonIndex: 1, history: [] },
        met: { seasonIndex: 2, history: [{ choice: 'burn' }] }
      },
      {
        id: 'first_clear_sky',
        unmet: { streak: 0 },
        met: { streak: 1 }
      },
      {
        id: 'three_seasons_clean',
        unmet: { streak: 2 },
        met: { streak: 3 }
      },
      {
        id: 'soil_savior',
        unmet: { soilHealth: 85 },
        met: { soilHealth: 90 }
      },
      {
        id: 'village_guardian',
        unmet: { villageHealth: 80 },
        met: { villageHealth: 89 }
      },
      {
        id: 'fast_hands',
        unmet: { perfectSowingCount: 0 },
        met: { perfectSowingCount: 1 }
      },
      {
        id: 'biomass_tycoon',
        unmet: { totalBaleIncome: 15000 },
        met: { totalBaleIncome: 30000 }
      },
      {
        id: 'happy_seeder_hero',
        unmet: { happySeederUses: 1 },
        met: { happySeederUses: 2 }
      },
      {
        id: 'compost_master',
        unmet: { compostUses: 1 },
        met: { compostUses: 2 }
      },
      {
        id: 'mulch_pioneer',
        unmet: { mulchUses: 0 },
        met: { mulchUses: 1 }
      },
      {
        id: 'pillar_of_community',
        unmet: { reputation: 80 },
        met: { reputation: 87 }
      },
      {
        id: 'five_season_legend',
        unmet: { seasonIndex: 4, history: [1, 2, 3, 4] },
        met: { seasonIndex: 5, history: [1, 2, 3, 4, 5] }
      }
    ]

    for (const tc of testCases) {
      const ach = GAME_BALANCE.ACHIEVEMENTS.find((a) => a.id === tc.id)
      assert.ok(ach, `Achievement ${tc.id} not found in balance`)
      assert.strictEqual(
        ach.condition(tc.unmet),
        false,
        `Achievement ${tc.id} should NOT be met with unmet state`
      )
      assert.strictEqual(
        ach.condition(tc.met),
        true,
        `Achievement ${tc.id} SHOULD be met with qualifying state`
      )
    }
  })
})
