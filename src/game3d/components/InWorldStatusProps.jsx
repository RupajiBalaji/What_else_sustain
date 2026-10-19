import React from 'react'
import * as THREE from 'three'
import { useGame3D } from '../context/Game3DContext'
import { ManagedOverlay } from '../ui/OverlayManager'

/**
 * InWorldStatusProps.jsx
 * Replaces flat UI meters with tangible, in-world physical representations:
 * 1. Village Health Banner at the village road entrance
 * 2. Farm Gate Reputation Flag at the farm boundary
 * 3. Farmer's Accounting Desk & Coin Chest beside the farmhouse
 */
export default function InWorldStatusProps() {
  const { persistentState } = useGame3D()
  const villageHealth = persistentState?.villageHealth ?? 75
  const reputation = persistentState?.reputation ?? 50
  const money = persistentState?.money ?? 12000

  // Village banner appearance based on villageHealth
  const isVillageThriving = villageHealth >= 70
  const isVillageStrained = villageHealth < 45

  const bannerColor = isVillageThriving ? '#2E7D32' : isVillageStrained ? '#C62828' : '#F57F17'
  const bannerText = isVillageThriving
    ? '🌸 SWACHH GRAM • CLEAN AIR VILLAGE 🌸'
    : isVillageStrained
    ? '⚠️ SMOKE WARNING • SENSITIVE AIR'
    : '🌾 GRAM PANCHAYAT • HARVEST SEASON'

  // Reputation flag color based on reputation
  const flagColor = reputation >= 75 ? '#FFD700' : reputation >= 45 ? '#4CAF50' : '#8D6E63'
  const flagTitle = reputation >= 75 ? 'Pioneer' : reputation >= 45 ? 'Respected' : 'Strained'

  return (
    <group name="InWorldStatusPropsGroup">
      {/* 1. VILLAGE ENTRY ARCH & BANNER (Road into village at Z=36.5) */}
      <group position={[0, 0, 36.5]}>
        {/* Left Arch Pillar */}
        <mesh position={[-3.6, 2.2, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.25, 4.4, 8]} />
          <meshStandardMaterial color="#5D4037" roughness={0.9} />
        </mesh>
        {/* Right Arch Pillar */}
        <mesh position={[3.6, 2.2, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.25, 4.4, 8]} />
          <meshStandardMaterial color="#5D4037" roughness={0.9} />
        </mesh>
        {/* Crossbeam */}
        <mesh position={[0, 4.2, 0]} castShadow>
          <boxGeometry args={[7.8, 0.35, 0.35]} />
          <meshStandardMaterial color="#4E342E" roughness={0.9} />
        </mesh>

        {/* Hanging Village Signboard */}
        <mesh position={[0, 3.4, 0]}>
          <boxGeometry args={[5.2, 1.1, 0.12]} />
          <meshStandardMaterial color={bannerColor} roughness={0.7} />
        </mesh>

        {/* 3D In-World Text Label on Arch */}
        <ManagedOverlay
          id="village_sign"
          priority="decorative_sign"
          position={[0, 3.4, 0.08]}
          icon="🏡"
          collapsedBadge="Village"
          center
        >
          <div
            style={{
              backgroundColor: bannerColor,
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              fontWeight: 900,
              fontSize: '12px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              textAlign: 'center',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            <div>{bannerText}</div>
            <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '2px' }}>
              Village Health: {Math.round(villageHealth)}/100
            </div>
          </div>
        </ManagedOverlay>
      </group>

      {/* 2. FARM GATE REPUTATION FLAG (Entry to main farm at X=2.5, Z=5.0) */}
      <group position={[2.5, 0, 5.0]}>
        {/* Flag Pole */}
        <mesh position={[0, 2.4, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 4.8, 8]} />
          <meshStandardMaterial color="#8D6E63" roughness={0.6} />
        </mesh>
        {/* Base Stone */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.45, 0.55, 0.4, 8]} />
          <meshStandardMaterial color="#78909C" roughness={0.9} />
        </mesh>
        {/* Fabric Pennant */}
        <mesh position={[0.65, 4.1, 0]}>
          <boxGeometry args={[1.2, 0.75, 0.04]} />
          <meshStandardMaterial color={flagColor} roughness={0.8} />
        </mesh>

        {/* World Label for Reputation */}
        <ManagedOverlay
          id="reputation_flag"
          priority="decorative_sign"
          position={[0, 4.8, 0]}
          icon="👑"
          collapsedBadge="Reputation"
          center
        >
          <div
            style={{
              backgroundColor: 'rgba(22, 56, 43, 0.9)',
              color: flagColor,
              padding: '4px 10px',
              borderRadius: '9999px',
              border: `1.5px solid ${flagColor}`,
              fontWeight: 900,
              fontSize: '11px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            <span>👑</span>
            <span>Reputation: {Math.round(reputation)} ({flagTitle})</span>
          </div>
        </ManagedOverlay>
      </group>

      {/* 3. FARMER'S LEDGER & COIN CHEST (Beside Farmhouse at X=11.5, Z=-8.0) */}
      <group position={[11.5, 0, -8.0]}>
        {/* Wooden Desk */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.2, 0.9, 0.8]} />
          <meshStandardMaterial color="#6D4C41" roughness={0.8} />
        </mesh>
        {/* Open Ledger Book */}
        <mesh position={[-0.2, 0.92, 0]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[0.45, 0.06, 0.35]} />
          <meshStandardMaterial color="#FFF8E1" roughness={0.9} />
        </mesh>
        {/* Brass Coin Box */}
        <mesh position={[0.3, 0.96, 0]}>
          <boxGeometry args={[0.32, 0.16, 0.28]} />
          <meshStandardMaterial color="#FFA000" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* World Tag for Farm Capital */}
        <ManagedOverlay
          id="farm_balance_tag"
          priority="status_prop"
          position={[0, 1.45, 0]}
          icon="💰"
          collapsedBadge={`₹${money.toLocaleString('en-IN')}`}
          center
        >
          <div
            style={{
              backgroundColor: 'rgba(27, 94, 32, 0.92)',
              color: '#FFD54F',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1.5px solid #FFD54F',
              fontWeight: 900,
              fontSize: '11px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            <span>💰</span>
            <span>Farm Balance: ₹{money.toLocaleString('en-IN')}</span>
          </div>
        </ManagedOverlay>
      </group>
    </group>
  )
}
