/**
 * VillageAssets.jsx
 * Layered modular SVG assets designed with Kenney.nl-compatible proportions and slot architecture.
 * Ready for drop-in replacements with Kenney sprite PNG/SVGs later.
 * 
 * Layers:
 * - Sky & Sun/Moon (Golden Hour / Day / Night / Smog)
 * - Animated Clouds & Distant Deccan Hills
 * - Meandering Village River (restores from dirty/dry to clear blue with waterlilies)
 * - Fields & Crops (Paddy straw piles, green lush shoots, blackened ash)
 * - Houses & Village School Garden (restores with solar panels, fruit trees, flowering vines)
 * - Interactive objects: Straw Pile, Mulcher, Bio-Decomposer Pit, Biomass Truck, Happy Seeder
 * - Animated Farmer Character
 */

import React from 'react'

// 1. Hills & Horizon
export function DistantHills({ timeOfDay = 'golden', natureHealth = 60 }) {
  const isSmog = natureHealth < 40
  const hillColor1 = isSmog
    ? '#5C544E'
    : timeOfDay === 'night'
    ? '#121F28'
    : timeOfDay === 'golden'
    ? '#8D5832'
    : '#3E6B48'

  const hillColor2 = isSmog
    ? '#423B36'
    : timeOfDay === 'night'
    ? '#0B151C'
    : timeOfDay === 'golden'
    ? '#683E20'
    : '#2D4F35'

  return (
    <svg viewBox="0 0 1600 320" preserveAspectRatio="none" className="parallax-svg" style={{ width: '100%', height: '100%' }}>
      {/* Far hills */}
      <path
        d="M0,220 Q240,110 520,180 T1040,140 Q1320,190 1600,160 L1600,320 L0,320 Z"
        fill={hillColor1}
        opacity={0.65}
      />
      {/* Closer undulating hills with acacia tree silhouettes */}
      <path
        d="M0,260 Q360,170 780,240 T1440,210 Q1520,230 1600,240 L1600,320 L0,320 Z"
        fill={hillColor2}
      />
      {/* Distant palm tree silhouettes */}
      <g opacity={0.6} fill={hillColor2}>
        <path d="M320,195 Q325,160 330,140 L333,140 Q325,160 322,195 Z M330,140 Q310,130 295,138 M330,140 Q340,120 355,125 M330,140 Q360,135 365,148 M330,140 Q320,115 315,118" stroke={hillColor2} strokeWidth="3" fill="none" />
        <path d="M960,175 Q963,145 968,125 L971,125 Q964,145 962,175 Z M968,125 Q950,118 940,125 M968,125 Q980,110 990,115 M968,125 Q995,122 1000,135" stroke={hillColor2} strokeWidth="3" fill="none" />
      </g>
    </svg>
  )
}

// 2. Village River Layer (reflects nature health restoration)
export function VillageRiver({ natureHealth = 60, timeOfDay = 'golden' }) {
  // If health is low (e.g. after burning), river turns muddy brown/sluggish
  const riverColor = natureHealth < 40
    ? '#6B5B49'
    : natureHealth > 75
    ? '#2E8EB5'
    : '#3B7E9E'

  const highlightColor = natureHealth > 75 ? '#8ED9EC' : '#64A6BF'

  return (
    <svg viewBox="0 0 1600 160" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      {/* River bank */}
      <path d="M0,100 C300,120 600,70 900,90 C1200,110 1450,85 1600,95 L1600,160 L0,160 Z" fill="#7D6246" />
      {/* Water body */}
      <path d="M0,110 C320,130 620,80 920,100 C1220,120 1460,95 1600,105 L1600,160 L0,160 Z" fill={riverColor} />
      {/* Water reflection ripples */}
      <path d="M120,135 Q220,130 320,136 M500,115 Q620,110 740,117 M1020,130 Q1140,125 1260,132" stroke={highlightColor} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity={0.7} />

      {/* When healthy (>75%), show lotus / water lilies */}
      {natureHealth > 70 && (
        <g transform="translate(420, 120)">
          <ellipse cx="0" cy="0" rx="14" ry="6" fill="#2E7D32" />
          <path d="M0,-2 L-4,-10 L0,-12 L4,-10 Z" fill="#E91E63" />
          <circle cx="0" cy="-6" r="3" fill="#FFEB3B" />
        </g>
      )}
      {natureHealth > 85 && (
        <g transform="translate(1120, 135)">
          <ellipse cx="0" cy="0" rx="16" ry="7" fill="#2E7D32" />
          <path d="M0,-2 L-5,-11 L0,-14 L5,-11 Z" fill="#FF80AB" />
          <circle cx="0" cy="-7" r="3" fill="#FFF" />
        </g>
      )}
    </svg>
  )
}

// 3. Indian Village Houses & School Garden
export function VillageSettlement({ natureHealth = 60 }) {
  const isHealthy = natureHealth >= 70
  const isDamaged = natureHealth < 40

  const roofColor = isDamaged ? '#63493E' : '#B84A28' // Traditional terracotta tiles
  const wallColor = isDamaged ? '#A89F91' : '#F4E7D3' // Warm whitewashed mud plaster

  return (
    <svg viewBox="0 0 600 240" className="settlement-svg" style={{ overflow: 'visible' }}>
      {/* House 1: Traditional tile-roof farmer house with veranda */}
      <g transform="translate(40, 60)">
        <polygon points="10,60 190,60 170,140 30,140" fill={wallColor} stroke="#4A3B32" strokeWidth="2" />
        {/* Slanted Mangalore tile roof */}
        <polygon points="0,60 100,5 200,60" fill={roofColor} stroke="#3D261C" strokeWidth="2" />
        {/* Tile texture ribs */}
        <line x1="40" y1="60" x2="100" y2="10" stroke="#8A341B" strokeWidth="1.5" />
        <line x1="80" y1="60" x2="100" y2="10" stroke="#8A341B" strokeWidth="1.5" />
        <line x1="120" y1="60" x2="100" y2="10" stroke="#8A341B" strokeWidth="1.5" />
        <line x1="160" y1="60" x2="100" y2="10" stroke="#8A341B" strokeWidth="1.5" />
        {/* Veranda wooden pillars */}
        <rect x="45" y="90" width="8" height="50" fill="#6B4423" />
        <rect x="145" y="90" width="8" height="50" fill="#6B4423" />
        {/* Doorway */}
        <rect x="85" y="85" width="30" height="55" fill="#3D261C" rx="3" />
        {/* Rangoli in front of doorway if healthy */}
        {isHealthy && (
          <circle cx="100" cy="143" r="10" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3,3" />
        )}
      </g>

      {/* House 2: Village School & Panchayat building */}
      <g transform="translate(260, 40)">
        <rect x="20" y="70" width="220" height="100" fill={wallColor} stroke="#4A3B32" strokeWidth="2" />
        <polygon points="10,70 130,20 250,70" fill="#8C3820" stroke="#3D261C" strokeWidth="2" />
        {/* School flag post */}
        <line x1="130" y1="20" x2="130" y2="-15" stroke="#FFFFFF" strokeWidth="3" />
        <polygon points="130,-15 150,-8 130,-1" fill="#FF9933" />
        {/* School windows & board */}
        <rect x="40" y="90" width="35" height="35" fill="#6E8E9C" stroke="#3D261C" strokeWidth="2" />
        <rect x="165" y="90" width="35" height="35" fill="#6E8E9C" stroke="#3D261C" strokeWidth="2" />
        <rect x="95" y="85" width="50" height="85" fill="#3D261C" rx="4" />
        
        {/* Solar panel on school roof when restoration is high */}
        {isHealthy && (
          <g transform="translate(150, 30) rotate(-22)">
            <rect width="60" height="28" fill="#1A3B5C" stroke="#A0C4E2" strokeWidth="1.5" rx="2" />
            <line x1="20" y1="0" x2="20" y2="28" stroke="#A0C4E2" strokeWidth="1" />
            <line x1="40" y1="0" x2="40" y2="28" stroke="#A0C4E2" strokeWidth="1" />
            <line x1="0" y1="14" x2="60" y2="14" stroke="#A0C4E2" strokeWidth="1" />
          </g>
        )}
      </g>

      {/* School Garden / Tree (blooms when restored) */}
      <g transform="translate(500, 50)">
        {/* Trunk */}
        <path d="M35,160 Q40,110 32,80 Q45,100 48,160 Z" fill="#5A3D28" />
        {/* Foliage */}
        <circle cx="35" cy="65" r="45" fill={isDamaged ? '#736B5E' : isHealthy ? '#2E8540' : '#4E8A3C'} />
        <circle cx="10" cy="75" r="30" fill={isDamaged ? '#5E574B' : isHealthy ? '#246B33' : '#3E7030'} />
        <circle cx="60" cy="70" r="32" fill={isDamaged ? '#5E574B' : isHealthy ? '#389B4C' : '#5A9648'} />
        
        {/* Fruits / flowers when healthy */}
        {isHealthy && (
          <g fill="#FFA726">
            <circle cx="20" cy="60" r="5" />
            <circle cx="45" cy="50" r="5" />
            <circle cx="55" cy="80" r="5" />
            <circle cx="30" cy="90" r="5" />
          </g>
        )}
      </g>
    </svg>
  )
}

// 4. Interactive Object: Stubble Straw Pile
export function StrawPile({ isBurning = false }) {
  return (
    <div className="interactive-object-container straw-pile-interactive">
      <svg viewBox="0 0 160 100" style={{ width: '130px', height: '80px', overflow: 'visible' }}>
        <defs>
          <radialGradient id="strawGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isBurning ? '#3D332A' : '#F4D06F'} />
            <stop offset="100%" stopColor={isBurning ? '#1A140E' : '#B8860B'} />
          </radialGradient>
        </defs>

        {/* Straw Mound */}
        <path
          d="M10,85 Q40,25 80,20 Q120,25 150,85 Z"
          fill="url(#strawGrad)"
          stroke={isBurning ? '#0F0B08' : '#8B6508'}
          strokeWidth="2"
        />
        {/* Individual straw stalks */}
        <g stroke={isBurning ? '#5A4634' : '#FFE57F'} strokeWidth="2" strokeLinecap="round">
          <line x1="30" y1="80" x2="45" y2="40" />
          <line x1="60" y1="80" x2="75" y2="30" />
          <line x1="90" y1="80" x2="85" y2="28" />
          <line x1="120" y1="80" x2="105" y2="42" />
          <line x1="50" y1="75" x2="95" y2="55" />
          <line x1="135" y1="78" x2="142" y2="60" />
        </g>

        {/* Ash glow if burning */}
        {isBurning && (
          <ellipse cx="80" cy="75" rx="50" ry="12" fill="#FF5722" opacity={0.6} className="ember-glow" />
        )}
      </svg>
    </div>
  )
}

// 5. In-World Alternative Object 1: Mulcher / Straw Chopper
export function MulcherObject({ onSelect, isSelected }) {
  return (
    <div
      onClick={onSelect}
      className={`alternative-inworld-node ${isSelected ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Mulcher / Straw Chopper"
    >
      <svg viewBox="0 0 120 100" style={{ width: '100px', height: '80px' }}>
        {/* Tractor attachment frame */}
        <rect x="20" y="35" width="70" height="35" rx="6" fill="#D32F2F" stroke="#7B1FA2" strokeWidth="2" />
        {/* Rotating roller blades */}
        <circle cx="55" cy="52" r="18" fill="#37474F" stroke="#B0BEC5" strokeWidth="2" />
        <line x1="42" y1="42" x2="68" y2="62" stroke="#ECEFF1" strokeWidth="3" />
        <line x1="68" y1="42" x2="42" y2="62" stroke="#ECEFF1" strokeWidth="3" />
        {/* Discharge chute */}
        <polygon points="75,35 95,15 105,25 85,45" fill="#C62828" />
        {/* Green soil mulch sparkles */}
        <circle cx="102" cy="18" r="3" fill="#8BC34A" />
        <circle cx="112" cy="24" r="2.5" fill="#4CAF50" />
      </svg>
      <span className="inworld-label">🚜 Mulcher</span>
    </div>
  )
}

// 6. In-World Alternative Object 2: Bio-Decomposer Pit
export function CompostPitObject({ onSelect, isSelected }) {
  return (
    <div
      onClick={onSelect}
      className={`alternative-inworld-node ${isSelected ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Bio-Decomposer Pit"
    >
      <svg viewBox="0 0 120 100" style={{ width: '100px', height: '80px' }}>
        {/* Dug-out earth pit with wooden boundary */}
        <ellipse cx="60" cy="55" rx="46" ry="24" fill="#3E2723" stroke="#5D4037" strokeWidth="3" />
        <ellipse cx="60" cy="55" rx="38" ry="18" fill="#1B120C" />
        {/* Organic compost layers & friendly earthworm */}
        <path d="M40,55 Q50,45 65,56 T90,52" stroke="#689F38" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M35,60 Q55,68 75,58" stroke="#8D6E63" strokeWidth="3" fill="none" />
        {/* Bio-spray bottle */}
        <rect x="75" y="22" width="16" height="24" rx="3" fill="#00897B" stroke="#004D40" strokeWidth="1.5" />
        <path d="M79,22 L79,15 L87,15 L87,22 Z" fill="#004D40" />
        <circle cx="95" cy="12" r="2" fill="#80CBC4" />
        <circle cx="98" cy="17" r="1.5" fill="#80CBC4" />
      </svg>
      <span className="inworld-label">🪱 Bio-Decomposer</span>
    </div>
  )
}

// 7. In-World Alternative Object 3: Truck to Biomass Unit
export function BiomassTruckObject({ onSelect, isSelected }) {
  return (
    <div
      onClick={onSelect}
      className={`alternative-inworld-node ${isSelected ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Truck to Biomass Unit"
    >
      <svg viewBox="0 0 130 100" style={{ width: '110px', height: '80px' }}>
        {/* Traditional decorated Indian transport truck */}
        {/* Cargo bed loaded with neat straw bales */}
        <rect x="10" y="32" width="70" height="34" rx="3" fill="#F57C00" stroke="#BF360C" strokeWidth="2" />
        {/* Straw bales */}
        <rect x="15" y="16" width="30" height="16" rx="2" fill="#FBC02D" stroke="#F57F17" strokeWidth="1" />
        <rect x="48" y="16" width="28" height="16" rx="2" fill="#FBC02D" stroke="#F57F17" strokeWidth="1" />
        {/* Cabin */}
        <polygon points="80,66 80,28 108,28 118,48 118,66" fill="#1976D2" stroke="#0D47A1" strokeWidth="2" />
        <rect x="88" y="34" width="20" height="15" fill="#BBDEFB" />
        {/* Big wheels */}
        <circle cx="30" cy="68" r="12" fill="#263238" stroke="#ECEFF1" strokeWidth="3" />
        <circle cx="62" cy="68" r="12" fill="#263238" stroke="#ECEFF1" strokeWidth="3" />
        <circle cx="102" cy="68" r="12" fill="#263238" stroke="#ECEFF1" strokeWidth="3" />
        {/* Coin badge for cash profit */}
        <circle cx="100" cy="14" r="9" fill="#FFD700" stroke="#FF8F00" strokeWidth="2" />
        <text x="100" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#B78103">₹</text>
      </svg>
      <span className="inworld-label">💰 Biomass Sale</span>
    </div>
  )
}

// 8. In-World Alternative Object 4: Happy Seeder
export function HappySeederObject({ onSelect, isSelected }) {
  return (
    <div
      onClick={onSelect}
      className={`alternative-inworld-node ${isSelected ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Happy Seeder Direct Sowing"
    >
      <svg viewBox="0 0 120 100" style={{ width: '100px', height: '80px' }}>
        {/* Tractor seed drill combo */}
        <rect x="18" y="32" width="75" height="28" rx="4" fill="#2E7D32" stroke="#1B5E20" strokeWidth="2" />
        {/* Seed fertilizer dual hoppers */}
        <polygon points="25,32 35,14 55,14 50,32" fill="#43A047" stroke="#1B5E20" strokeWidth="1.5" />
        <polygon points="55,32 60,14 80,14 75,32" fill="#43A047" stroke="#1B5E20" strokeWidth="1.5" />
        {/* Ground furrow openers / tines */}
        <line x1="28" y1="60" x2="22" y2="76" stroke="#263238" strokeWidth="3" />
        <line x1="48" y1="60" x2="42" y2="76" stroke="#263238" strokeWidth="3" />
        <line x1="68" y1="60" x2="62" y2="76" stroke="#263238" strokeWidth="3" />
        {/* Gauge wheels */}
        <circle cx="85" cy="64" r="10" fill="#37474F" stroke="#CFD8DC" strokeWidth="2" />
        {/* Young green sprout emerging */}
        <path d="M42,75 Q42,65 38,62 M42,75 Q42,66 48,64" stroke="#76FF03" strokeWidth="2" fill="none" />
      </svg>
      <span className="inworld-label">🌱 Happy Seeder</span>
    </div>
  )
}

// 9. Animated Farmer Character (walk cycle & pose)
export function FarmerCharacter({ isWalking = false, facing = 'right', isLighting = false }) {
  return (
    <div
      className={`farmer-character-sprite ${isWalking ? 'walking' : ''} ${isLighting ? 'lighting' : ''}`}
      style={{ transform: `scaleX(${facing === 'left' ? -1 : 1})` }}
    >
      <svg viewBox="0 0 70 120" style={{ width: '56px', height: '96px', overflow: 'visible' }}>
        {/* Traditional cotton turban (Pheta/Paga) */}
        <ellipse cx="35" cy="22" rx="14" ry="10" fill="#E65100" />
        <ellipse cx="33" cy="20" rx="12" ry="7" fill="#F57C00" />
        <path d="M44,22 C48,26 46,36 43,40" stroke="#E65100" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Head & face */}
        <circle cx="35" cy="30" r="10" fill="#C68642" />
        {/* Eyes & friendly moustache */}
        <circle cx="39" cy="29" r="1.5" fill="#2E1C0C" />
        <path d="M33,34 Q41,33 43,36" stroke="#2E1C0C" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Kurta (white cotton shirt) */}
        <polygon points="24,40 46,40 49,78 21,78" fill="#FDFBF7" stroke="#D1CAB5" strokeWidth="1.5" />
        {/* Green shoulder scarf (Angavastram / Gamcha) */}
        <path d="M25,40 Q35,52 38,72 Q31,52 25,40" fill="#2E7D32" />

        {/* Arms */}
        {isLighting ? (
          <g>
            {/* Arm bending forward with matchstick */}
            <path d="M44,45 L58,58 L64,68" stroke="#C68642" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Matchstick & flame */}
            <line x1="64" y1="68" x2="68" y2="76" stroke="#8D6E63" strokeWidth="2" />
            <circle cx="69" cy="77" r="4" fill="#FF5722" className="match-flicker" />
          </g>
        ) : (
          <path d="M43,44 Q50,60 48,70" stroke="#C68642" strokeWidth="3.5" strokeLinecap="round" fill="none" className="farmer-arm-swing" />
        )}

        {/* Dhoti / Pants */}
        <polygon points="21,78 49,78 46,102 24,102" fill="#EAE5D9" stroke="#BDB59C" strokeWidth="1.5" />
        
        {/* Legs with walking animation class */}
        <g className="farmer-legs">
          <line x1="29" y1="102" x2="27" y2="116" stroke="#C68642" strokeWidth="4" strokeLinecap="round" className="leg-left" />
          <line x1="41" y1="102" x2="43" y2="116" stroke="#C68642" strokeWidth="4" strokeLinecap="round" className="leg-right" />
        </g>
      </svg>
    </div>
  )
}
