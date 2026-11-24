/**
 * Camera-relative movement calculations.
 * Single source of truth for translating player inputs into world-space movement directions.
 */

/**
 * Calculates world-space movement vector based on camera heading and player inputs.
 * 
 * @param {number} headingYaw - Camera horizontal heading angle in radians (atan2(dir.x, dir.z))
 * @param {number} inputForward - Forward/backward input (+1 for forward/W/ArrowUp/stick-up, -1 for backward/S/stick-down)
 * @param {number} inputRight - Right/left input (+1 for right/D/ArrowRight/stick-right, -1 for left/A/stick-left)
 * @returns {{ x: number, y: number, z: number, magnitude: number }} World velocity direction vector and normalized input magnitude
 */
export function getMoveVector(headingYaw, inputForward, inputRight) {
  const mag = Math.hypot(inputForward, inputRight)
  if (mag < 1e-5) {
    return { x: 0, y: 0, z: 0, magnitude: 0 }
  }

  // Normalise diagonals so speed is consistent in all directions
  const normForward = inputForward / mag
  const normRight = inputRight / mag

  // World-space forward = (sin(headingYaw), 0, cos(headingYaw))
  // World-space right = (-cos(headingYaw), 0, sin(headingYaw))
  const sinY = Math.sin(headingYaw)
  const cosY = Math.cos(headingYaw)

  const x = normForward * sinY + normRight * (-cosY)
  const z = normForward * cosY + normRight * sinY

  return {
    x,
    y: 0,
    z,
    magnitude: Math.min(mag, 1.0)
  }
}

/**
 * Legacy buggy movement calculation preserved strictly as a negative control for testing.
 */
export function getOldMoveVector(camYaw, inputForward, inputRight) {
  const moveZ = -inputForward // old code: backward - forward
  const moveX = inputRight    // old code: right - left
  const mag = Math.hypot(moveX, moveZ)
  if (mag < 1e-5) return { x: 0, y: 0, z: 0, magnitude: 0 }

  const normX = moveX / Math.max(mag, 1)
  const normZ = moveZ / Math.max(mag, 1)
  const moveAngle = Math.atan2(normX, normZ) + camYaw
  return {
    x: Math.sin(moveAngle),
    y: 0,
    z: Math.cos(moveAngle),
    magnitude: Math.min(mag, 1.0)
  }
}

/**
 * Integrates player position over delta with delta clamping and sub-stepped collision detection.
 * Prevents long frames (e.g. lag spikes of 0.4s) from teleporting the farmer or skipping colliders.
 * 
 * @param {{ x: number, y: number, z: number }} curPos - Current mutable player position object
 * @param {{ x: number, y: number, z: number }} velocity - Current player velocity (m/s)
 * @param {number} delta - Frame delta time in seconds
 * @param {function({ x: number, y: number, z: number }): boolean} checkCollisions - Collision test returning true if colliding
 * @param {number} [maxDelta=0.1] - Maximum delta clamp for position integration (clamps frames <= 0.1s)
 * @param {number} [subSteps=4] - Number of sub-steps for collision checking
 * @returns {{ newPos: { x: number, y: number, z: number }, displacement: number, clampedDelta: number }}
 */
export function integratePlayerPosition(curPos, velocity, delta, checkCollisions, maxDelta = 0.1, subSteps = 4) {
  const clampedDelta = Math.min(delta, maxDelta)
  const subDelta = clampedDelta / Math.max(1, subSteps)
  const subVx = velocity.x * subDelta
  const subVz = velocity.z * subDelta

  const startX = curPos.x
  const startZ = curPos.z

  for (let s = 0; s < subSteps; s++) {
    // Separate X and Z sliding collisions
    if (!checkCollisions({ x: curPos.x + subVx, y: curPos.y, z: curPos.z })) {
      curPos.x += subVx
    }
    if (!checkCollisions({ x: curPos.x, y: curPos.y, z: curPos.z + subVz })) {
      curPos.z += subVz
    }
  }

  const displacement = Math.hypot(curPos.x - startX, curPos.z - startZ)
  return {
    newPos: curPos,
    displacement,
    clampedDelta
  }
}
