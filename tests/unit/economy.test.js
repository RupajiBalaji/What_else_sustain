import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CHOICE_ECONOMICS,
  computeChoiceFinancials,
  computeSeasonOutcome,
  applyDiminishingDelta,
  getSeasonGoal
} from '../../src/game3d/config/economy.js'
import { GAME_BALANCE } from '../../src/game3d/config/gameBalance.js'

test('Economy: choice financials derive from scenarios.json and scale with acres', () => {
  assert.ok(CHOICE_ECONOMICS.happy_seeder)
  assert.ok(CHOICE_ECONOMICS.bale_sell)
  assert.ok(CHOICE_ECONOMICS.mulch)
  assert.ok(CHOICE_ECONOMICS.compost)

  const hs5 = computeChoiceFinancials('happy_seeder', { acres: 5, seasonIndex: 1 })
  assert.equal(hs5.upfrontCost, 1400 * 5)
  assert.equal(hs5.decisionRevenue, -7000)

  const mulch5 = computeChoiceFinancials('mulch', { acres: 5, seasonIndex: 1 })
  assert.equal(mulch5.upfrontCost, 1200 * 5)

  const compost5 = computeChoiceFinancials('compost', { acres: 5, seasonIndex: 1 })
  assert.equal(compost5.upfrontCost, 400 * 5)

  const bale5 = computeChoiceFinancials('bale_sell', { acres: 5, seasonIndex: 1 })
  assert.equal(bale5.decisionRevenue, 2500)
  assert.deepEqual(bale5.econ.netRangePerAcre, [-200, 800])
  assert.equal(bale5.econ.region, 'Punjab')
})

test('Economy: HUD, callouts, and season report balance agree to the exact rupee', () => {
  const startState = { ...GAME_BALANCE.INITIAL_STATE }
  for (const key of ['burn', 'happy_seeder', 'bale_sell', 'mulch', 'compost']) {
    const out = computeSeasonOutcome(key, startState, { acres: 5, isPerfectSow: false })
    assert.equal(
      out.netSeasonBalance,
      out.cropRevenue - out.operatingCost + out.decisionRevenue + (out.setback?.amount || 0)
    )
    assert.equal(
      out.nextMoney,
      Math.max(0, startState.money - out.fin.upfrontCost + out.harvestAddition)
    )
  }
})

test('Economy: diminishing returns prevent reaching 100/100/100 before Season 8', () => {
  let state = { ...GAME_BALANCE.INITIAL_STATE }
  for (let s = 1; s <= 7; s++) {
    state.seasonIndex = s
    const out = computeSeasonOutcome('compost', state, { acres: 5 })
    state = {
      ...state,
      money: out.nextMoney,
      soilHealth: out.nextSoil,
      villageHealth: out.nextVillage,
      reputation: out.nextRep
    }
    const allCapped = state.soilHealth >= 100 && state.villageHealth >= 100 && state.reputation >= 100
    assert.equal(allCapped, false, `Hit 100/100/100 early at season ${s}`)
  }
  assert.ok(applyDiminishingDelta(95, 20) < 100)
  assert.ok(getSeasonGoal(1).includes('S1'))
})
