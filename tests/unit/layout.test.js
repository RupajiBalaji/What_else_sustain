import test from 'node:test'
import assert from 'node:assert/strict'
import { SCALES, verifyModelScale, VILLAGE_HOUSES_LAYOUT, VILLAGE_COLLIDERS_LAYOUT } from '../../src/game3d/world/layout.js'

test('Layout scales: verify farmer, houses, barn, tractor, trees, and straw piles within 25% target', () => {
  // 1. Farmer scale target
  assert.equal(SCALES.FARMER_HEIGHT, 1.7)
  const farmerCheck = verifyModelScale('farmer', { height: 1.75 })
  assert.equal(farmerCheck.valid, true)
  assert.ok(farmerCheck.deviation <= 0.25)

  // 2. House scale target (height and width)
  const houseHeightCheck = verifyModelScale('house', { height: 4.8 })
  assert.equal(houseHeightCheck.valid, true)
  assert.ok(houseHeightCheck.deviation <= 0.25)

  const houseWidthCheck = verifyModelScale('house', { width: 6.2, height: 4.8 })
  assert.equal(houseWidthCheck.valid, true)
  assert.ok(houseWidthCheck.deviation <= 0.25)

  // 3. Barn scale target
  const barnCheck = verifyModelScale('barn', { height: 7.0 })
  assert.equal(barnCheck.valid, true)
  assert.ok(barnCheck.deviation <= 0.25)

  // 4. Tractor scale target
  const tractorCheck = verifyModelScale('tractor', { height: 3.6 })
  assert.equal(tractorCheck.valid, true)
  assert.ok(tractorCheck.deviation <= 0.25)

  // 5. Trees scale target
  const treeCheck = verifyModelScale('tree', { height: 6.5 })
  assert.equal(treeCheck.valid, true)
  assert.ok(treeCheck.deviation <= 0.25)

  // 6. Straw pile scale target
  const pileCheck = verifyModelScale('straw_pile', { height: 2.1 })
  assert.equal(pileCheck.valid, true)
  assert.ok(pileCheck.deviation <= 0.25)

  // Negative control: excessive deviation (>25%) must fail
  const giantHouseCheck = verifyModelScale('house', { width: 14.0, height: 11.0 })
  assert.equal(giantHouseCheck.valid, false)
  assert.ok(giantHouseCheck.deviation > 0.25)
})

test('Layout village: 10 houses clustered downwind at 40-60m distance', () => {
  assert.equal(VILLAGE_HOUSES_LAYOUT.length, 10)
  assert.equal(VILLAGE_COLLIDERS_LAYOUT.length, 10)

  // Verify all houses are positioned at z >= 40 (downwind distance)
  for (const house of VILLAGE_HOUSES_LAYOUT) {
    assert.ok(house.z >= 40, `House ${house.id} z position (${house.z}) should be >= 40`)
    assert.ok(house.z <= 60, `House ${house.id} z position (${house.z}) should be <= 60`)
  }
})
