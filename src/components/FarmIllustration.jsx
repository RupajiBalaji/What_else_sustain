import React from 'react'

/**
 * FarmIllustration: Lightweight SVG & CSS interactive illustration.
 * States: 'normal' | 'burning' | 'sustainable'
 */
export default function FarmIllustration({ state = 'normal' }) {
  const isBurning = state === 'burning'
  const isSustainable = state === 'sustainable'

  // Dynamic sky & ground colors based on ecological state
  let skyColor1 = '#87CEEB'
  let skyColor2 = '#E0F6FF'
  let groundColor = '#D4A359' // Harvested straw gold
  let sunColor = '#FFD700'

  if (isBurning) {
    skyColor1 = '#3A3F44'
    skyColor2 = '#6C7A89'
    groundColor = '#3D2F27' // Charred ash
    sunColor = '#D9534F' // Blood red hazy sun
  } else if (isSustainable) {
    skyColor1 = '#4CA1AF'
    skyColor2 = '#C4E0E5'
    groundColor = '#3A633F' // Rich fertile green-brown
    sunColor = '#F4A81D'
  }

  return (
    <div
      className={`farm-illustration-box ${state}`}
      style={{
        width: '100%',
        height: '180px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'var(--shadow-sm)',
        border: '1.5px solid var(--color-border)',
        transition: 'all 0.5s ease'
      }}
    >
      <svg
        viewBox="0 0 400 200"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skyColor1} />
            <stop offset="100%" stopColor={skyColor2} />
          </linearGradient>

          <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF4500" />
            <stop offset="50%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="smokeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#4A4A4A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8A8A8A" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Sky Background */}
        <rect x="0" y="0" width="400" height="200" fill="url(#skyGrad)" />

        {/* Sun */}
        <circle
          cx="70"
          cy="45"
          r={isBurning ? 18 : 22}
          fill={sunColor}
          opacity={isBurning ? 0.6 : 0.9}
        />

        {/* Clouds or Smoke */}
        {!isBurning ? (
          <g fill="#FFFFFF" opacity="0.8">
            <path d="M 280,35 Q 295,20 315,30 Q 335,22 345,35 Q 355,48 335,50 L 290,50 Q 275,48 280,35 Z" />
            <path d="M 140,50 Q 155,38 170,45 Q 185,38 195,50 L 140,50 Z" opacity="0.6" />
          </g>
        ) : (
          /* Bilowing Smoke */
          <g fill="url(#smokeGrad)">
            <ellipse cx="120" cy="70" rx="60" ry="35" className="smoke-cloud smoke-1" />
            <ellipse cx="230" cy="55" rx="80" ry="40" className="smoke-cloud smoke-2" />
            <ellipse cx="320" cy="75" rx="50" ry="30" className="smoke-cloud smoke-3" />
          </g>
        )}

        {/* Distant Hills / Trees */}
        <path
          d="M 0,110 Q 70,85 150,105 Q 240,80 320,100 Q 370,90 400,105 L 400,200 L 0,200 Z"
          fill={isBurning ? '#4F5D54' : '#2A7247'}
          opacity={isBurning ? 0.4 : 0.6}
        />

        {/* Field Ground */}
        <path
          d="M 0,115 Q 120,108 230,116 Q 340,112 400,118 L 400,200 L 0,200 Z"
          fill={groundColor}
          style={{ transition: 'fill 0.5s ease' }}
        />

        {/* Normal State: Golden Straw Stubble */}
        {!isBurning && !isSustainable && (
          <g stroke="#C28E3B" strokeWidth="2.5" strokeLinecap="round">
            <line x1="40" y1="135" x2="38" y2="125" />
            <line x1="45" y1="138" x2="48" y2="126" />
            <line x1="85" y1="145" x2="82" y2="132" />
            <line x1="92" y1="148" x2="95" y2="134" />
            <line x1="150" y1="138" x2="147" y2="124" />
            <line x1="190" y1="145" x2="194" y2="132" />
            <line x1="240" y1="138" x2="236" y2="125" />
            <line x1="280" y1="148" x2="283" y2="135" />
            <line x1="330" y1="140" x2="326" y2="128" />
            <line x1="360" y1="146" x2="363" y2="132" />
          </g>
        )}

        {/* Burning State: Flickering Flames & Ash */}
        {isBurning && (
          <g>
            {/* Flames across field */}
            <path
              d="M 30,135 Q 40,110 45,135 Q 55,105 60,135 Q 70,112 75,135 Z"
              fill="url(#fireGrad)"
              className="flame-flicker"
            />
            <path
              d="M 130,140 Q 140,115 148,140 Q 158,108 165,140 Q 175,118 180,140 Z"
              fill="url(#fireGrad)"
              className="flame-flicker delay-1"
            />
            <path
              d="M 240,135 Q 250,112 258,135 Q 268,105 275,135 Q 285,114 290,135 Z"
              fill="url(#fireGrad)"
              className="flame-flicker delay-2"
            />
            {/* Glowing Embers */}
            <circle cx="80" cy="115" r="2.5" fill="#FFA500" className="ember ember-1" />
            <circle cx="160" cy="100" r="2" fill="#FF4500" className="ember ember-2" />
            <circle cx="270" cy="105" r="3" fill="#FFD700" className="ember ember-3" />
          </g>
        )}

        {/* Sustainable State: Fresh Green Sprouts & Earthworm Signs */}
        {isSustainable && (
          <g fill="#2E9E5B">
            {/* Young sprouted shoots */}
            <path d="M 40,135 Q 35,122 42,120 Q 48,122 43,135 Z" />
            <path d="M 43,135 Q 50,125 53,124 Q 52,132 45,135 Z" />

            <path d="M 90,142 Q 85,130 92,128 Q 98,130 93,142 Z" />
            <path d="M 93,142 Q 100,132 103,130 Q 102,138 95,142 Z" />

            <path d="M 160,135 Q 155,120 162,118 Q 168,120 163,135 Z" />
            <path d="M 230,140 Q 225,126 232,124 Q 238,126 233,140 Z" />
            <path d="M 285,135 Q 280,122 287,120 Q 293,122 288,135 Z" />

            {/* Earthworm or moisture sparkle indicator */}
            <circle cx="130" cy="148" r="3" fill="#F4A81D" opacity="0.8" />
            <circle cx="205" cy="152" r="3.5" fill="#B7E36A" opacity="0.9" />
          </g>
        )}

        {/* Farmer Character */}
        <g transform="translate(325, 82)">
          {/* Shadow */}
          <ellipse cx="25" cy="95" rx="18" ry="5" fill="rgba(0,0,0,0.2)" />

          {/* Legs / Dhoti */}
          <path d="M 15,62 L 13,88 L 22,88 L 24,66 L 26,66 L 28,88 L 37,88 L 35,62 Z" fill="#F6F3E8" />
          {/* Feet */}
          <ellipse cx="17" cy="89" rx="5" ry="3" fill="#8B4513" />
          <ellipse cx="33" cy="89" rx="5" ry="3" fill="#8B4513" />

          {/* Kurta Body */}
          <path
            d="M 12,38 L 8,62 L 42,62 L 38,38 Z"
            fill={isBurning ? '#7A7A7A' : '#2E9E5B'}
          />

          {/* Arms */}
          {isBurning ? (
            /* Hands near face/coughing */
            <g stroke="#D4A373" strokeWidth="4" strokeLinecap="round">
              <line x1="12" y1="42" x2="22" y2="30" />
              <line x1="38" y1="42" x2="26" y2="30" />
            </g>
          ) : isSustainable ? (
            /* Arms raised triumphantly */
            <g stroke="#D4A373" strokeWidth="4" strokeLinecap="round">
              <line x1="12" y1="42" x2="3" y2="24" />
              <line x1="38" y1="42" x2="47" y2="24" />
            </g>
          ) : (
            /* Holding farm rake/tool */
            <g>
              <line x1="43" y1="20" x2="43" y2="90" stroke="#8B4513" strokeWidth="3" />
              {/* Rake prongs */}
              <line x1="37" y1="20" x2="49" y2="20" stroke="#4A6357" strokeWidth="3" />
              <line x1="38" y1="16" x2="38" y2="20" stroke="#4A6357" strokeWidth="2" />
              <line x1="43" y1="16" x2="43" y2="20" stroke="#4A6357" strokeWidth="2" />
              <line x1="48" y1="16" x2="48" y2="20" stroke="#4A6357" strokeWidth="2" />
              <line x1="38" y1="42" x2="43" y2="48" stroke="#D4A373" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}

          {/* Head & Neck */}
          <rect x="22" y="28" width="6" height="8" fill="#D4A373" />
          <circle cx="25" cy="20" r="10" fill="#D4A373" />

          {/* Turban / Headcloth */}
          <path
            d="M 14,16 Q 25,6 36,16 Q 37,20 25,20 Q 13,20 14,16 Z"
            fill={isBurning ? '#999999' : '#F4A81D'}
          />
          {/* Turban tail */}
          <path d="M 33,16 Q 38,22 36,28" stroke={isBurning ? '#999999' : '#F4A81D'} strokeWidth="3" fill="none" />

          {/* Face Expression */}
          {isBurning ? (
            /* Coughing mask or sad eyes */
            <g>
              <circle cx="21" cy="18" r="1.5" fill="#333333" />
              <circle cx="28" cy="18" r="1.5" fill="#333333" />
              {/* Cloth mask over mouth */}
              <rect x="18" y="21" width="14" height="7" rx="3" fill="#FFFFFF" opacity="0.9" />
              <line x1="18" y1="24" x2="16" y2="20" stroke="#FFFFFF" strokeWidth="1" />
              <line x1="32" y1="24" x2="34" y2="20" stroke="#FFFFFF" strokeWidth="1" />
            </g>
          ) : (
            /* Smiling eyes & mustache */
            <g>
              <circle cx="21" cy="18" r="1.5" fill="#333333" />
              <circle cx="28" cy="18" r="1.5" fill="#333333" />
              <path d="M 20,23 Q 25,26 30,23" stroke="#5C3A21" strokeWidth="1.5" fill="none" />
            </g>
          )}
        </g>
      </svg>

      {/* Floating status badge on top right */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '12px',
          background: isBurning
            ? 'rgba(217, 83, 79, 0.9)'
            : isSustainable
            ? 'rgba(46, 158, 91, 0.95)'
            : 'rgba(11, 61, 46, 0.85)',
          color: '#FFFFFF',
          fontSize: '0.72rem',
          fontWeight: 800,
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}
      >
        <span>{isBurning ? '🔥 Field Burning' : isSustainable ? '🌱 Soil Enriched' : '🌾 Harvested Field'}</span>
      </div>
    </div>
  )
}
