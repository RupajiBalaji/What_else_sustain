import test from 'node:test'
import assert from 'node:assert/strict'
import {
  captureDecisionSnapshot,
  restoreDecisionSnapshot,
  recordOneTimeDiscovery
} from '../../src/game3d/state/rewindSnapshot.js'
import { GAME_BALANCE } from '../../src/game3d/config/gameBalance.js'

test('Rewind Snapshot: capture and restore restores all persistent counters while keeping discovery bonuses', () => {
  const startState = {
    ...GAME_BALANCE.INITIAL_STATE,
    totalBaleIncome: 0,
    happySeederUses: 0,
    compostUses: 0,
    mulchUses: 0,
    perfectSowingCount: 1,
    history: [],
    achievements: ['first_season']
  }

  const snapshot = captureDecisionSnapshot(startState)

  // Simulate playing Bale & Sell and completing a season
  let mutated = {
    ...startState,
    money: startState.money + 31800,
    soilHealth: 76,
    villageHealth: 95,
    reputation: 68,
    farmerXP: 75,
    streak: 1,
    totalBaleIncome: 15000,
    history: [{ seasonIndex: 1, choiceKey: 'bale_sell', netSeasonBalance: 31800, rank: 'A' }]
  }
  const disc1 = recordOneTimeDiscovery(mutated, 'bale_sell')
  assert.equal(disc1.awarded, true)
  mutated = disc1.state

  // Negative control: without restoreDecisionSnapshot, money is inflated
  assert.notEqual(mutated.money, snapshot.money)

  // Restore on rewind
  const restored = restoreDecisionSnapshot(mutated, snapshot)
  assert.equal(restored.money, startState.money)
  assert.equal(restored.soilHealth, startState.soilHealth)
  assert.equal(restored.villageHealth, startState.villageHealth)
  assert.equal(restored.reputation, startState.reputation)
  assert.equal(restored.farmerXP, startState.farmerXP)
  assert.equal(restored.streak, startState.streak)
  assert.equal(restored.totalBaleIncome, 0)
  assert.deepEqual(restored.history, [])

  // One-time discovery bonus must remain recorded and never re-awarded
  assert.deepEqual(restored.discoveryBonusesAwarded, ['bale_sell'])
  const disc2 = recordOneTimeDiscovery(restored, 'bale_sell')
  assert.equal(disc2.awarded, false)
})

test('Rewind Snapshot: playing all 5 options with rewinds never exceeds start + 1 season result', () => {
  const startState = { ...GAME_BALANCE.INITIAL_STATE, history: [], achievements: [] }
  const snapshot = captureDecisionSnapshot(startState)

  const simulatedDeltas = [
    { key: 'burn', moneyDelta: -3500 + 16800, soilDelta: -25, villageDelta: -30, xp: 15 },
    { key: 'happy_seeder', moneyDelta: -2500 + 16800, soilDelta: 14, villageDelta: 18, xp: 65 },
    { key: 'bale_sell', moneyDelta: 15000 + 16800, soilDelta: 6, villageDelta: 20, xp: 75 },
    { key: 'mulch', moneyDelta: -1200 + 16800, soilDelta: 20, villageDelta: 16, xp: 60 },
    { key: 'compost', moneyDelta: -800 + 16800, soilDelta: 24, villageDelta: 18, xp: 70 }
  ]

  const maxSingleSeasonResult = Math.max(...simulatedDeltas.map((d) => d.moneyDelta))
  let current = { ...startState }

  for (let i = 0; i < simulatedDeltas.length; i++) {
    const opt = simulatedDeltas[i]
    current = {
      ...current,
      money: current.money + opt.moneyDelta,
      soilHealth: Math.min(100, Math.max(0, current.soilHealth + opt.soilDelta)),
      villageHealth: Math.min(100, Math.max(0, current.villageHealth + opt.villageDelta)),
      farmerXP: current.farmerXP + opt.xp,
      streak: opt.key === 'burn' ? 0 : current.streak + 1
    }
    assert.ok(
      current.money <= startState.money + maxSingleSeasonResult,
      `Money ${current.money} exceeded start + 1 season max (${startState.money + maxSingleSeasonResult})`
    )
    if (i < simulatedDeltas.length - 1) {
      current = restoreDecisionSnapshot(current, snapshot)
      assert.equal(current.money, startState.money)
    }
  }
})

test('Rewind Snapshot (A1): play Burn, rewind, play Happy Seeder, rewind restores every value to snapshot', () => {
  const startState = {
    ...GAME_BALANCE.INITIAL_STATE,
    money: 12000,
    soilHealth: 70,
    villageHealth: 75,
    reputation: 50,
    farmerXP: 25,
    streak: 2,
    history: [],
    achievements: []
  }
  const snapshot = captureDecisionSnapshot(startState)

  // Play Burn
  let afterBurn = {
    ...startState,
    money: startState.money - 17500,
    soilHealth: 45,
    villageHealth: 45,
    reputation: 30,
    farmerXP: 40,
    streak: 0,
    history: [{ seasonIndex: 1, choiceKey: 'burn' }]
  }
  afterBurn = recordOneTimeDiscovery(afterBurn, 'burn').state
  const rewound1 = restoreDecisionSnapshot(afterBurn, snapshot)
  for (const k of ['money', 'soilHealth', 'villageHealth', 'reputation', 'farmerXP', 'streak']) {
    assert.equal(rewound1[k], snapshot[k], `Burn rewind mismatch on ${k}`)
  }
  assert.deepEqual(rewound1.discoveryBonusesAwarded, ['burn'])

  // Play Happy Seeder
  let afterHS = {
    ...rewound1,
    money: rewound1.money - 7000,
    soilHealth: 84,
    villageHealth: 93,
    reputation: 66,
    farmerXP: 90,
    streak: 3,
    history: [{ seasonIndex: 1, choiceKey: 'happy_seeder' }]
  }
  afterHS = recordOneTimeDiscovery(afterHS, 'happy_seeder').state
  const rewound2 = restoreDecisionSnapshot(afterHS, snapshot)
  for (const k of ['money', 'soilHealth', 'villageHealth', 'reputation', 'farmerXP', 'streak']) {
    assert.equal(rewound2[k], snapshot[k], `Happy Seeder rewind mismatch on ${k}`)
  }
  assert.deepEqual(rewound2.discoveryBonusesAwarded, ['burn', 'happy_seeder'])
})
