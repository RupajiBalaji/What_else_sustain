import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

/**
 * Handles cinematic camera sequences:
 * 1. 6-second opening flyover sweep from village to player (skippable).
 * 2. Burn push-in & slow-mo focus on torch with subtle camera shake during big fire.
 * 3. Machine showcase dollies for Happy Seeder, Baler, Mulch, Compost.
 */
export default function CinematicCamera({ playerPosition, playerYaw = 0, isAtPile = false }) {
  const { camera } = useThree()
  const {
    cinematicMode,
    setCinematicMode,
    isFlyoverActive,
    skipFlyover,
    burnState,
    activeAlternative,
    activePile,
    interactionTarget
  } = useGame3D()

  const flyoverStartTimeRef = useRef(null)
  const isBurning = burnState === 'burning'

  // Listen for skip inputs during opening flyover
  useEffect(() => {
    if (!isFlyoverActive) return

    const handleSkip = (e) => {
      if (e.type === 'keydown') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape' || e.code === 'KeyE') {
          skipFlyover()
        }
      } else if (e.type === 'pointerdown' || e.type === 'touchstart') {
        skipFlyover()
      }
    }

    window.addEventListener('keydown', handleSkip)
    window.addEventListener('pointerdown', handleSkip)
    return () => {
      window.removeEventListener('keydown', handleSkip)
      window.removeEventListener('pointerdown', handleSkip)
    }
  }, [isFlyoverActive, skipFlyover])

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime()
    const pPos = playerPosition?.current || new THREE.Vector3(-1.2, 0, 10.0)

    // 1. OPENING 6-SECOND FLYOVER
    if (isFlyoverActive && cinematicMode === 'flyover') {
      if (flyoverStartTimeRef.current === null) {
        flyoverStartTimeRef.current = elapsed
      }
      const t = elapsed - flyoverStartTimeRef.current
      const duration = 6.0
      const prog = Math.min(1.0, t / duration)

      // Smooth easeInOutCubic curve
      const ease = prog < 0.5 ? 4 * prog * prog * prog : 1 - Math.pow(-2 * prog + 2, 3) / 2

      // Camera sweep path: High over village -> sweep across field -> settle behind farmer
      const startCam = new THREE.Vector3(5.0, 24.0, 58.0) // Above village
      const midCam = new THREE.Vector3(-15.0, 12.0, 28.0) // Midfield view of crop rows & tractor
      const endCam = new THREE.Vector3(pPos.x - 0.4, pPos.y + 3.2, pPos.z - 5.5) // Behind farmer

      // Quadratic bezier curve interpolation
      const curCam = new THREE.Vector3()
      curCam.x = (1 - ease) * (1 - ease) * startCam.x + 2 * (1 - ease) * ease * midCam.x + ease * ease * endCam.x
      curCam.y = (1 - ease) * (1 - ease) * startCam.y + 2 * (1 - ease) * ease * midCam.y + ease * ease * endCam.y
      curCam.z = (1 - ease) * (1 - ease) * startCam.z + 2 * (1 - ease) * ease * midCam.z + ease * ease * endCam.z

      // LookAt target tracks smoothly toward farmer
      const startLook = new THREE.Vector3(0, 2.0, 40.0)
      const endLook = new THREE.Vector3(pPos.x, pPos.y + 1.4, pPos.z)
      const curLook = new THREE.Vector3().lerpVectors(startLook, endLook, ease)

      camera.position.copy(curCam)
      camera.lookAt(curLook)

      if (prog >= 1.0) {
        skipFlyover()
      }
      return
    }

    // 2. BURN TORCH PUSH-IN BEAT
    if (cinematicMode === 'burn_focus') {
      const targetPile = activePile || interactionTarget || { x: pPos.x, z: pPos.z + 2.5 }
      const focusCamX = targetPile.x + 2.4
      const focusCamY = 2.4
      const focusCamZ = targetPile.z - 4.2

      camera.position.lerp(new THREE.Vector3(focusCamX, focusCamY, focusCamZ), 0.12)
      camera.lookAt(targetPile.x, 1.2, targetPile.z + 1.2)
      return
    }

    // 3. ALTERNATIVE SHOWCASE DOLLY
    if (cinematicMode === 'alt_showcase') {
      let showcaseCam = null
      let showcaseLook = null

      if (activeAlternative === 'happy_seeder') {
        // Dynamic low tracking angle framing tractor sowing green rows
        showcaseCam = new THREE.Vector3(-2.0, 2.8, 18.0)
        showcaseLook = new THREE.Vector3(-8.0, 1.2, 22.0)
      } else if (activeAlternative === 'bale_sell') {
        // Wide framing of baler collecting round straw bales
        showcaseCam = new THREE.Vector3(12.0, 3.5, 20.0)
        showcaseLook = new THREE.Vector3(6.0, 1.5, 25.0)
      } else if (activeAlternative === 'mulch' || activeAlternative === 'compost') {
        // Close angle of soil cutaway and microbial regeneration
        showcaseCam = new THREE.Vector3(-3.5, 1.6, 9.8)
        showcaseLook = new THREE.Vector3(-4.0, 0.4, 8.2)
      }

      if (showcaseCam && showcaseLook) {
        camera.position.lerp(showcaseCam, 0.08)
        camera.lookAt(showcaseLook)
        return
      }
    }

    // 4. SUBTLE CAMERA SHAKE DURING HEAVY FIRE
    let shakeOffset = new THREE.Vector3(0, 0, 0)
    if (isBurning) {
      const shakeAmt = 0.025
      shakeOffset.set(
        Math.sin(elapsed * 34) * shakeAmt,
        Math.cos(elapsed * 28) * shakeAmt,
        Math.sin(elapsed * 42) * shakeAmt * 0.5
      )
    }

    // 5. STANDARD 3RD PERSON CAMERA FOLLOW (Smooth glide over shoulder when interacting)
    const camDistance = isAtPile ? 3.4 : 5.8
    const camHeight = isAtPile ? 2.15 : 3.2
    const shoulderOffset = isAtPile ? 0.72 : 0

    const behindX = -Math.sin(playerYaw) * camDistance
    const behindZ = -Math.cos(playerYaw) * camDistance
    const sideX = Math.cos(playerYaw) * shoulderOffset
    const sideZ = -Math.sin(playerYaw) * shoulderOffset

    const targetCamX = pPos.x + behindX + sideX + shakeOffset.x
    const targetCamY = pPos.y + camHeight + shakeOffset.y
    const targetCamZ = pPos.z + behindZ + sideZ + shakeOffset.z

    const targetLookX = isAtPile ? pPos.x + sideX * 0.25 : pPos.x
    const targetLookY = isAtPile ? pPos.y + 1.25 : pPos.y + 1.4
    const targetLookZ = isAtPile ? pPos.z + sideZ * 0.25 : pPos.z

    camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), isAtPile ? 0.08 : 0.12)
    camera.lookAt(targetLookX, targetLookY, targetLookZ)
  })

  return null
}
