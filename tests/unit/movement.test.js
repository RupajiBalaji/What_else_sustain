import { test, describe } from 'node:test'
import assert from 'node:assert'
import { getMoveVector, getOldMoveVector, integratePlayerPosition } from '../../src/game3d/utils/movement.js'

describe('Camera-Relative Movement (getMoveVector)', () => {
  const headingAngles = [0, 0.5, Math.PI / 2, Math.PI, -2, 3.7]

  headingAngles.forEach((headingYaw) => {
    describe(`at headingYaw = ${headingYaw} rad`, () => {
      const fwdVec = {
        x: Math.sin(headingYaw),
        y: 0,
        z: Math.cos(headingYaw)
      }
      const rightVec = {
        x: -Math.cos(headingYaw),
        y: 0,
        z: Math.sin(headingYaw)
      }

      const dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y + v1.z * v2.z

      test('W (forward=1, right=0) aligns with camera forward: dot > 0.99', () => {
        const vec = getMoveVector(headingYaw, 1, 0)
        const d = dot(vec, fwdVec)
        assert.ok(d > 0.99, `Expected dot(vec, fwdVec) > 0.99, got ${d}`)
      })

      test('S (forward=-1, right=0) opposes camera forward: dot < -0.99', () => {
        const vec = getMoveVector(headingYaw, -1, 0)
        const d = dot(vec, fwdVec)
        assert.ok(d < -0.99, `Expected dot(vec, fwdVec) < -0.99, got ${d}`)
      })

      test('D (forward=0, right=1) aligns with camera right: dot > 0.99', () => {
        const vec = getMoveVector(headingYaw, 0, 1)
        const d = dot(vec, rightVec)
        assert.ok(d > 0.99, `Expected dot(vec, rightVec) > 0.99, got ${d}`)
      })

      test('A (forward=0, right=-1) opposes camera right: dot < -0.99', () => {
        const vec = getMoveVector(headingYaw, 0, -1)
        const d = dot(vec, rightVec)
        assert.ok(d < -0.99, `Expected dot(vec, rightVec) < -0.99, got ${d}`)
      })

      test('W+D (forward=1, right=1) produces exact 45-degree angle with forward', () => {
        const vec = getMoveVector(headingYaw, 1, 1)
        const d = dot(vec, fwdVec)
        const expectedCos45 = Math.cos(Math.PI / 4) // ~0.7071
        assert.ok(
          Math.abs(d - expectedCos45) < 0.005,
          `Expected dot(vec, fwdVec) ≈ cos(45°) (${expectedCos45}), got ${d}`
        )
        const dRight = dot(vec, rightVec)
        assert.ok(
          Math.abs(dRight - expectedCos45) < 0.005,
          `Expected dot(vec, rightVec) ≈ cos(45°) (${expectedCos45}), got ${dRight}`
        )
      })
    })
  })

  describe('Negative Control (Proving old formula fails)', () => {
    test('Old formula with W (forward=1) produces reversed vector: fails dot > 0.99', () => {
      const headingYaw = 0
      const fwdVec = { x: Math.sin(headingYaw), y: 0, z: Math.cos(headingYaw) } // (0, 0, 1)
      const oldVec = getOldMoveVector(headingYaw, 1, 0)
      const dot = oldVec.x * fwdVec.x + oldVec.z * fwdVec.z
      // Old formula gave dot = -1.0 (moving backward)
      assert.ok(dot < 0, `Old formula moved backward: dot was ${dot}`)
      assert.strictEqual(dot > 0.99, false, 'Old formula correctly fails the forward test')
    })

    test('Old formula with D (right=1) produces reversed vector: fails dot > 0.99', () => {
      const headingYaw = 0
      const rightVec = { x: -Math.cos(headingYaw), y: 0, z: Math.sin(headingYaw) } // (-1, 0, 0)
      const oldVec = getOldMoveVector(headingYaw, 0, 1)
      const dot = oldVec.x * rightVec.x + oldVec.z * rightVec.z
      // Old formula gave dot = -1.0 (moving left)
      assert.ok(dot < 0, `Old formula moved left: dot was ${dot}`)
      assert.strictEqual(dot > 0.99, false, 'Old formula correctly fails the rightward test')
    })
  })

  describe('Delta Clamping & Sub-Stepped Position Integration (Item 4 & Item 2)', () => {
    test('Simulating a 0.4 s frame asserts farmer moves no more than 0.3 m', () => {
      const curPos = { x: 0, y: 0, z: 0 }
      const speed = 2.8 // typical walking velocity
      const velocity = { x: 0, y: 0, z: speed }
      const noCollisions = () => false

      const result = integratePlayerPosition(curPos, velocity, 0.4, noCollisions)

      // Clamped delta = 0.1s -> displacement = 2.8 * 0.1 = 0.28 m <= 0.3 m
      assert.ok(result.displacement <= 0.3, `Farmer moved ${result.displacement}m, expected <= 0.3m`)
      assert.ok(result.displacement >= 0.25, `Farmer moved ${result.displacement}m, expected >= 0.25m`)
      assert.strictEqual(result.clampedDelta, 0.1, `Clamped delta was ${result.clampedDelta}, expected 0.1`)
    })

    test('At delta 0.1 s the farmer covers speed times 0.1 m', () => {
      const curPos = { x: 0, y: 0, z: 0 }
      const speed = 4.5
      const velocity = { x: 0, y: 0, z: speed }
      const noCollisions = () => false

      const result = integratePlayerPosition(curPos, velocity, 0.1, noCollisions)
      const expectedDist = speed * 0.1 // 0.45 m
      assert.ok(
        Math.abs(result.displacement - expectedDist) < 1e-4,
        `Farmer covered ${result.displacement}m, expected ${expectedDist}m`
      )
    })

    test('Simulating a 0.4 s frame towards a collider asserts farmer never enters collider', () => {
      const curPos = { x: 0, y: 0, z: 0 }
      const velocity = { x: 0, y: 0, z: 5.5 }
      // Obstacle starts at z = 0.15m
      const colliderCheck = (p) => p.z >= 0.15

      const result = integratePlayerPosition(curPos, velocity, 0.4, colliderCheck)

      // Farmer must stop before z = 0.15 and never enter collider
      assert.ok(result.newPos.z < 0.15, `Farmer entered collider at z = ${result.newPos.z}`)
      assert.strictEqual(colliderCheck(result.newPos), false, 'Farmer position must not be inside collider')
    })

    test('Negative control: Unclamped 0.4 s integration moves 2.2 m and jumps collider', () => {
      const curPos = { x: 0, y: 0, z: 0 }
      const velocity = { x: 0, y: 0, z: 5.5 }
      const colliderCheck = (p) => p.z >= 0.15 && p.z <= 0.50

      // Unclamped integration (old code behavior)
      const unclampedDisplacement = velocity.z * 0.4 // 2.2 m
      const nextZ = curPos.z + unclampedDisplacement
      const hitCollider = colliderCheck({ x: 0, y: 0, z: nextZ })

      // Old single step jumped right through/over the collider (0.15 to 0.50) landing at 2.2m
      assert.ok(unclampedDisplacement > 0.3, `Unclamped moved ${unclampedDisplacement}m > 0.3m`)
      assert.strictEqual(hitCollider, false, 'Unclamped single step skipped over thin collider boundary')
    })
  })
})
