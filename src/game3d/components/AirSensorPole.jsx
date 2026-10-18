import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useGame3D } from '../context/Game3DContext'

/**
 * Tall Air Quality Sensor Station Pole installed beside the village.
 * Displays real-time simulated village smoke exposure from /api/simulate/smoke.
 * Labeled "Simulated, game model" with strictly NO unverified AQI numbers.
 */
export default function AirSensorPole({ position = [-2.5, 0, 40.5] }) {
  const { quality, burnState, burnProgress, smokeData, activeAlternative } = useGame3D()
  const isHigh = quality !== 'low'

  const anemometerRef = useRef(null)
  const beaconLightRef = useRef(null)
  const beaconMeshRef = useRef(null)

  const isBurning = burnState === 'burning'
  const isBurnt = burnState === 'consequence'

  // Calculate simulated exposure ratio
  const progressRatio = isBurnt ? 1.0 : isBurning ? Math.min(1.0, burnProgress * 1.2) : 0
  const rawTarget = smokeData?.villageExposure ?? 62
  const currentExposure = Math.round(
    activeAlternative ? Math.max(1, 2) : rawTarget * progressRatio
  )

  const isHazardous = currentExposure > 30

  // Animate spinning wind cups & beacon light
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Spin anemometer wind cups
    if (anemometerRef.current) {
      anemometerRef.current.rotation.y = t * 4.5
    }

    // Beacon blink rate (faster warning blink when hazardous)
    if (beaconLightRef.current && beaconMeshRef.current) {
      const blinkSpeed = isHazardous ? 6.0 : 1.5
      const blink = Math.sin(t * blinkSpeed) > 0 ? 1 : 0.15
      beaconLightRef.current.intensity = isHazardous ? blink * 1.8 : blink * 0.6
      beaconMeshRef.current.material.emissiveIntensity = isHazardous ? blink * 2.0 : 0.4
    }
  })

  // Determine meter color
  const meterColor = isHazardous ? '#E53935' : currentExposure > 15 ? '#FB8C00' : '#43A047'
  const meterBg = isHazardous ? 'rgba(211, 47, 47, 0.25)' : 'rgba(67, 160, 71, 0.25)'

  return (
    <group position={position} name="AirSensorPole">
      {/* 1. Concrete Base Pedestal */}
      <mesh position={[0, 0.25, 0]} castShadow={isHigh} receiveShadow={isHigh}>
        <boxGeometry args={[1.1, 0.5, 1.1]} />
        <meshStandardMaterial color="#B0BEC5" roughness={0.9} />
      </mesh>

      {/* 2. Steel Mast Pole (6.8m tall) */}
      <mesh position={[0, 3.65, 0]} castShadow={isHigh} receiveShadow={isHigh}>
        <cylinderGeometry args={[0.07, 0.1, 6.8, 8]} />
        <meshStandardMaterial color="#78909C" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 3. Solar Panel Bracket */}
      <group position={[0.3, 4.8, 0]} rotation={[0.4, 0, -0.3]}>
        <mesh castShadow={isHigh}>
          <boxGeometry args={[0.7, 0.04, 0.5]} />
          <meshStandardMaterial color="#0D47A1" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[0.74, 0.04, 0.54]} />
          <meshStandardMaterial color="#37474F" />
        </mesh>
      </group>

      {/* 4. Crossbar Arm with Particulate Air Intake */}
      <group position={[0, 6.2, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
          <meshStandardMaterial color="#546E7A" metalness={0.7} />
        </mesh>

        {/* Air Sample Intake Funnel (Left) */}
        <mesh position={[-0.6, -0.15, 0]}>
          <cylinderGeometry args={[0.09, 0.04, 0.35, 8]} />
          <meshStandardMaterial color="#ECEFF1" metalness={0.4} />
        </mesh>

        {/* Spinning Anemometer Wind Cups (Right) */}
        <group ref={anemometerRef} position={[0.6, 0.15, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
            <meshStandardMaterial color="#37474F" />
          </mesh>
          <mesh position={[0.1, 0.1, 0]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color="#FFB300" />
          </mesh>
          <mesh position={[-0.1, 0.1, 0]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color="#FFB300" />
          </mesh>
          <mesh position={[0, 0.1, 0.1]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color="#FFB300" />
          </mesh>
        </group>
      </group>

      {/* 5. Warning Beacon Light on Mast Top */}
      <group position={[0, 7.15, 0]}>
        <mesh ref={beaconMeshRef}>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 8]} />
          <meshStandardMaterial
            color={isHazardous ? '#FF1744' : '#00E676'}
            emissive={isHazardous ? '#FF1744' : '#00E676'}
            emissiveIntensity={1.2}
          />
        </mesh>
        <pointLight
          ref={beaconLightRef}
          color={isHazardous ? '#FF1744' : '#00E676'}
          intensity={1.2}
          distance={12}
        />
      </group>

      {/* 6. World-Space Digital Meter Display attached to pole */}
      <Html position={[0.45, 4.2, 0]} distanceFactor={18} zIndexRange={[12, 0]}>
        <div
          style={{
            backgroundColor: 'rgba(24, 32, 38, 0.96)',
            borderRadius: '16px',
            padding: '10px 14px',
            border: `2px solid ${meterColor}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            color: '#FFFFFF',
            width: '210px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>📡</span>
              <span>Village Air Station</span>
            </span>
            <span
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '6px',
                backgroundColor: meterBg,
                color: meterColor,
                fontWeight: 800
              }}
            >
              {isHazardous ? '⚠️ SMOKE' : '🌱 CLEAN'}
            </span>
          </div>

          {/* Meter Value & Progress Bar */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, marginBottom: '3px' }}>
              <span style={{ color: '#CFD8DC' }}>Simulated exposure</span>
              <span style={{ color: meterColor, fontWeight: 900 }}>{currentExposure} / 100</span>
            </div>

            <div style={{ width: '100%', height: '8px', backgroundColor: '#37474F', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(2, currentExposure))}%`,
                  height: '100%',
                  backgroundColor: meterColor,
                  borderRadius: '4px',
                  transition: 'width 0.4s ease, background-color 0.4s ease'
                }}
              />
            </div>
          </div>

          {/* Strict Requirement: Label "Simulated, game model" */}
          <div style={{ fontSize: '9.5px', color: '#90A4AE', fontStyle: 'italic', lineHeight: 1.25 }}>
            Simulated, game model
          </div>
        </div>
      </Html>
    </group>
  )
}
