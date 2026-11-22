import { test, describe } from 'node:test'
import assert from 'node:assert'
import { getMoveVector, getOldMoveVector } from '../../src/game3d/utils/movement.js'

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
})
