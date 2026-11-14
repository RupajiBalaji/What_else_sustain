import test from 'node:test'
import assert from 'node:assert/strict'
import { createSeasonMachine, SEASON_STATES } from '../../src/game3d/state/seasonMachine.js'

test('SeasonMachine: Full season valid state transitions', () => {
  const machine = createSeasonMachine(SEASON_STATES.LOADING, 'full')
  assert.equal(machine.getState(), SEASON_STATES.LOADING)

  // LOADING -> MODE_SELECT
  machine.transition(SEASON_STATES.MODE_SELECT)
  assert.equal(machine.getState(), SEASON_STATES.MODE_SELECT)

  // MODE_SELECT -> SOWING
  machine.transition(SEASON_STATES.SOWING)
  assert.equal(machine.getState(), SEASON_STATES.SOWING)

  // SOWING -> GROWING
  machine.transition(SEASON_STATES.GROWING)
  assert.equal(machine.getState(), SEASON_STATES.GROWING)

  // GROWING -> HARVEST
  machine.transition(SEASON_STATES.HARVEST)
  assert.equal(machine.getState(), SEASON_STATES.HARVEST)

  // HARVEST -> DECISION
  machine.transition(SEASON_STATES.DECISION)
  assert.equal(machine.getState(), SEASON_STATES.DECISION)

  // DECISION -> CONSEQUENCE
  machine.transition(SEASON_STATES.CONSEQUENCE, { choiceId: 'burn' })
  assert.equal(machine.getState(), SEASON_STATES.CONSEQUENCE)
  assert.deepEqual(machine.getTriedChoices(), ['burn'])

  // CONSEQUENCE -> REPORT
  machine.transition(SEASON_STATES.REPORT)
  assert.equal(machine.getState(), SEASON_STATES.REPORT)

  // REPORT -> SOWING (Next Season)
  machine.transition(SEASON_STATES.SOWING)
  assert.equal(machine.getState(), SEASON_STATES.SOWING)
})

test('SeasonMachine: Quick play direct jump to decision', () => {
  const machine = createSeasonMachine(SEASON_STATES.LOADING, 'quick')
  machine.transition(SEASON_STATES.MODE_SELECT)

  // Quick play transitions directly to decision
  machine.transition(SEASON_STATES.DECISION)
  assert.equal(machine.getState(), SEASON_STATES.DECISION)

  machine.transition(SEASON_STATES.CONSEQUENCE, { choiceId: 'happy_seeder' })
  assert.equal(machine.getState(), SEASON_STATES.CONSEQUENCE)
  assert.deepEqual(machine.getTriedChoices(), ['happy_seeder'])
})

test('SeasonMachine: Rewind back to decision from consequence', () => {
  const machine = createSeasonMachine(SEASON_STATES.DECISION)
  machine.transition(SEASON_STATES.CONSEQUENCE, { choiceId: 'burn' })

  // Rewind
  const state = machine.rewind()
  assert.equal(state, SEASON_STATES.DECISION)
  assert.equal(machine.getState(), SEASON_STATES.DECISION)

  // Try second alternative
  machine.transition(SEASON_STATES.CONSEQUENCE, { choiceId: 'compost' })
  assert.deepEqual(machine.getTriedChoices(), ['burn', 'compost'])
})

test('SeasonMachine: Rejects invalid transitions', () => {
  const machine = createSeasonMachine(SEASON_STATES.SOWING)

  // SOWING cannot jump directly to REPORT
  assert.throws(() => {
    machine.transition(SEASON_STATES.REPORT)
  }, /Invalid transition/)

  // SOWING cannot jump directly to CONSEQUENCE
  assert.throws(() => {
    machine.transition(SEASON_STATES.CONSEQUENCE)
  }, /Invalid transition/)

  // Cannot rewind while in SOWING
  assert.throws(() => {
    machine.rewind()
  }, /Invalid rewind/)
})
