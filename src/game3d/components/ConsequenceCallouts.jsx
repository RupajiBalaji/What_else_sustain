import React, { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useGame3D } from '../context/Game3DContext'

/**
 * Individual World-Space Callout Card with an SVG connecting pointer line
 * pointing directly to the 3D world feature it describes.
 */
function SingleCallout({
  position,
  title,
  detail,
  tag,
  icon,
  color,
  bgColor,
  borderColor,
  distanceFactor = 22,
  lineDirection = 'top-right'
}) {
  const isRight = lineDirection === 'top-right'

  return (
    <group position={position}>
      <Html center={false} distanceFactor={distanceFactor} zIndexRange={[60, 0]}>
        <div
          style={{
            position: 'relative',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            userSelect: 'none',
            pointerEvents: 'none',
            animation: 'fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
          }}
        >
          {/* Thin Vector Pointer Line from (0,0) anchor to Card */}
          <svg
            width="80"
            height="60"
            style={{
              position: 'absolute',
              top: '-45px',
              left: isRight ? '0px' : '-80px',
              pointerEvents: 'none',
              overflow: 'visible'
            }}
          >
            {/* Target anchor beacon ring */}
            <circle cx={isRight ? '0' : '80'} cy="45" r="4.5" fill={color} />
            <circle cx={isRight ? '0' : '80'} cy="45" r="8" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />

            {/* Connecting thin diagonal line */}
            <line
              x1={isRight ? '0' : '80'}
              y1="45"
              x2={isRight ? '45' : '35'}
              y2="15"
              stroke={color}
              strokeWidth="2"
              strokeDasharray="4,3"
            />
            <circle cx={isRight ? '45' : '35'} cy="15" r="3" fill={color} />
          </svg>

          {/* Callout Label Card */}
          <div
            style={{
              position: 'absolute',
              top: '-70px',
              left: isRight ? '45px' : '-225px',
              width: '210px',
              backgroundColor: bgColor,
              border: `2px solid ${borderColor}`,
              borderRadius: '14px',
              padding: '8px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px'
            }}
          >
            {/* Header / Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{icon}</span>
                <span>{title}</span>
              </span>
            </div>

            {/* Description */}
            <div style={{ fontSize: '10px', color: '#37474F', lineHeight: 1.3, fontWeight: 600 }}>
              {detail}
            </div>

            {/* Verified / Model Badge */}
            <div style={{ fontSize: '9px', fontWeight: 800, color, opacity: 0.9 }}>
              {tag}
            </div>
          </div>
        </div>
      </Html>
    </group>
  )
}

/**
 * Sequenced in-world consequence callouts for Soil, Air, People, and Money.
 * Each callout fades in one at a time with a 1-second gap.
 */
export default function ConsequenceCallouts({ onContinueToModal }) {
  const { burnState, activeAlternative, smokeData, rupeeCount } = useGame3D()

  const isBurnt = burnState === 'consequence'
  const isAlternativeActive = Boolean(activeAlternative)

  // Step ticker: 0 -> 1 -> 2 -> 3 -> 4 (1-second intervals)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (!isBurnt && !isAlternativeActive) {
      setActiveStep(0)
      return
    }

    // Begin 1-second sequence
    setActiveStep(1) // Step 1: Soil (0s)

    const timer1 = setTimeout(() => setActiveStep(2), 1000) // Step 2: Air (1s)
    const timer2 = setTimeout(() => setActiveStep(3), 2000) // Step 3: People (2s)
    const timer3 = setTimeout(() => setActiveStep(4), 3000) // Step 4: Money (3s)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [isBurnt, isAlternativeActive])

  if (!isBurnt && !isAlternativeActive) return <group />

  // Positions of the 4 features in 3D world space
  const soilPos = [-4.0, 0.4, 8.2]
  const airSensorPos = [-2.5, 4.8, 40.5]
  const peoplePos = [2.0, 1.8, 44.0]
  // Money callout floats near the farmer's start area
  const moneyPos = [-1.2, 2.5, 10.0]

  return (
    <group name="ConsequenceCalloutsGroup">
      {/* 1. SOIL CALLOUT (Step >= 1) */}
      {activeStep >= 1 && (
        <SingleCallout
          position={soilPos}
          icon="🪱"
          title={isBurnt ? 'Soil: Life Destroyed' : 'Soil: Microbial Surge'}
          detail={
            isBurnt
              ? 'Heat penetrates root zone; earthworms and nitrogen vaporize.'
              : 'Worms and fungal enzymes thrive, turning stubble into rich humus.'
          }
          tag={isBurnt ? '100% Nitrogen Lost' : '15-25% Moisture Retained'}
          color={isBurnt ? '#D32F2F' : '#2E7D32'}
          bgColor={isBurnt ? 'rgba(255, 235, 238, 0.96)' : 'rgba(232, 245, 233, 0.96)'}
          borderColor={isBurnt ? '#EF5350' : '#66BB6A'}
          lineDirection="top-right"
          distanceFactor={18}
        />
      )}

      {/* 2. AIR CALLOUT (Step >= 2, 1-second gap) */}
      {activeStep >= 2 && (
        <SingleCallout
          position={airSensorPos}
          icon="💨"
          title={isBurnt ? `Air: Exposure ~${smokeData?.villageExposure || 62}` : 'Air: Zero Smoke'}
          detail={
            isBurnt
              ? 'Dense particulate plume blankets village homes in toxic smog.'
              : 'Clean air maintained; village station reads clean baseline (1/100).'
          }
          tag="Simulated, game model"
          color={isBurnt ? '#E65100' : '#0277BD'}
          bgColor={isBurnt ? 'rgba(255, 243, 224, 0.96)' : 'rgba(225, 245, 254, 0.96)'}
          borderColor={isBurnt ? '#FFA726' : '#29B6F6'}
          lineDirection="top-left"
          distanceFactor={28}
        />
      )}

      {/* 3. PEOPLE CALLOUT (Step >= 3, 2-second gap) */}
      {activeStep >= 3 && (
        <SingleCallout
          position={peoplePos}
          icon={isBurnt ? '😷' : '👋'}
          title={isBurnt ? 'People: Severe Coughing' : 'People: Cheerful Village'}
          detail={
            isBurnt
              ? 'Children & elders cover faces as PM2.5 triggers asthma.'
              : 'Villagers breathe fresh air, waving cheerfully across the fields.'
          }
          tag={isBurnt ? 'Respiratory Distress' : 'Healthy Rural Community'}
          color={isBurnt ? '#C2185B' : '#388E3C'}
          bgColor={isBurnt ? 'rgba(252, 228, 236, 0.96)' : 'rgba(232, 245, 233, 0.96)'}
          borderColor={isBurnt ? '#EC407A' : '#81C784'}
          lineDirection="top-right"
          distanceFactor={28}
        />
      )}

      {/* 4. MONEY CALLOUT (Step >= 4, 3-second gap) */}
      {activeStep >= 4 && (
        <SingleCallout
          position={moneyPos}
          icon={isBurnt ? '💸' : '💰'}
          title={isBurnt ? 'Cost: ~₹3,500 / acre hidden loss' : 'Gain: Saved fertilizer & earnings'}
          detail={
            isBurnt
              ? 'Burning destroys soil nutrients, forcing expensive synthetic urea next season.'
              : 'Sustainable methods save irrigation costs and earn direct revenue.'
          }
          tag={isBurnt ? 'Financial drain every season' : 'Long-term soil wealth'}
          color={isBurnt ? '#B71C1C' : '#1B5E20'}
          bgColor={isBurnt ? 'rgba(255, 235, 238, 0.96)' : 'rgba(232, 245, 233, 0.96)'}
          borderColor={isBurnt ? '#D32F2F' : '#388E3C'}
          lineDirection="top-right"
          distanceFactor={14}
        />
      )}
    </group>
  )
}
