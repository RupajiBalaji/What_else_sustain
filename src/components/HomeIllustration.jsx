import React from 'react'

/**
 * HomeIllustration: Lightweight SVG & CSS interactive illustration for Scenario 2.
 * States: 'normal' | 'burning' | 'sustainable'
 */
export default function HomeIllustration({ state = 'normal' }) {
  const isBurning = state === 'burning'
  const isSustainable = state === 'sustainable'

  let wallColor1 = '#FFF9E6'
  let wallColor2 = '#F0E6D2'
  let floorColor = '#D8C29D'
  let windowSkyColor = '#87CEEB'

  if (isBurning) {
    wallColor1 = '#4A4A4A'
    wallColor2 = '#2C3E50'
    floorColor = '#595959'
    windowSkyColor = '#5A4E4D'
  } else if (isSustainable) {
    wallColor1 = '#E8F5E9'
    wallColor2 = '#C8E6C9'
    floorColor = '#A1887F'
    windowSkyColor = '#64B5F6'
  }

  return (
    <div
      className={`farm-illustration-box home-illustration-box ${state}`}
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
          <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={wallColor1} />
            <stop offset="100%" stopColor={wallColor2} />
          </linearGradient>

          <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A0E7E5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4BB543" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="homeSmokeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#222222" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#666666" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Room Wall */}
        <rect x="0" y="0" width="400" height="145" fill="url(#wallGrad)" />

        {/* Floor */}
        <rect x="0" y="145" width="400" height="55" fill={floorColor} />

        {/* Baseboard line */}
        <line x1="0" y1="145" x2="400" y2="145" stroke="#795548" strokeWidth="3" opacity="0.4" />

        {/* Window in Background */}
        <g transform="translate(45, 20)">
          {/* Frame */}
          <rect x="0" y="0" width="105" height="95" rx="6" fill="#8D6E63" />
          {/* Window Glass */}
          <rect x="6" y="6" width="93" height="83" rx="4" fill={windowSkyColor} />

          {/* Outside View: Sun or Smog */}
          {!isBurning ? (
            <g>
              <circle cx="75" cy="25" r="14" fill="#FFD54F" opacity="0.9" />
              <path d="M 6,70 Q 30,55 60,65 Q 85,55 99,70 L 99,89 L 6,89 Z" fill="#4CAF50" />
            </g>
          ) : (
            <g>
              <circle cx="75" cy="25" r="12" fill="#D9534F" opacity="0.6" />
              <ellipse cx="50" cy="50" rx="35" ry="20" fill="url(#homeSmokeGrad)" />
            </g>
          )}

          {/* Window Panes */}
          <line x1="52" y1="6" x2="52" y2="89" stroke="#8D6E63" strokeWidth="3" />
          <line x1="6" y1="48" x2="99" y2="48" stroke="#8D6E63" strokeWidth="3" />
        </g>

        {/* Normal State: Table with Single Plastic Bottle */}
        {!isBurning && !isSustainable && (
          <g>
            {/* Wooden Side Table */}
            <rect x="180" y="125" width="70" height="40" rx="3" fill="#A1887F" />
            <line x1="188" y1="165" x2="188" y2="185" stroke="#6D4C41" strokeWidth="4" />
            <line x1="242" y1="165" x2="242" y2="185" stroke="#6D4C41" strokeWidth="4" />

            {/* Clear Plastic Bottle */}
            <g transform="translate(205, 90)">
              {/* Bottle Body */}
              <rect x="4" y="10" width="16" height="25" rx="3" fill="url(#bottleGrad)" stroke="#4A90E2" strokeWidth="1.5" />
              {/* Neck & Cap */}
              <rect x="8" y="4" width="8" height="6" fill="#4A90E2" />
              <rect x="7" y="1" width="10" height="4" rx="1" fill="#E74C3C" />
              {/* Label */}
              <rect x="4" y="18" width="16" height="8" fill="#F4A81D" opacity="0.8" />
            </g>
          </g>
        )}

        {/* Burning / Toxic Smoke State */}
        {isBurning && (
          <g>
            {/* Black Soot & Scorched Surface */}
            <ellipse cx="215" cy="165" rx="45" ry="12" fill="#222222" opacity="0.8" />

            {/* Toxic Smoke Clouds in Room */}
            <ellipse cx="160" cy="65" rx="45" ry="25" fill="url(#homeSmokeGrad)" className="smoke-cloud smoke-1" />
            <ellipse cx="235" cy="50" rx="55" ry="30" fill="url(#homeSmokeGrad)" className="smoke-cloud smoke-2" />
            <ellipse cx="310" cy="70" rx="40" ry="22" fill="url(#homeSmokeGrad)" className="smoke-cloud smoke-3" />

            {/* Flame flickers on burning plastic */}
            <path
              d="M 205,160 Q 212,130 215,160 Q 222,125 227,160 Q 235,135 240,160 Z"
              fill="#FF4500"
              className="flame-flicker"
            />
          </g>
        )}

        {/* Sustainable State: Upcycled Planters & Recycling Bag */}
        {isSustainable && (
          <g>
            {/* Shelf / Table with Planters */}
            <rect x="170" y="125" width="90" height="38" rx="4" fill="#8D6E63" />
            <line x1="178" y1="163" x2="178" y2="185" stroke="#5D4037" strokeWidth="4" />
            <line x1="252" y1="163" x2="252" y2="185" stroke="#5D4037" strokeWidth="4" />

            {/* Upcycled Bottle Planter 1 (Mint) */}
            <g transform="translate(182, 94)">
              {/* Cut bottle base with soil */}
              <rect x="0" y="12" width="18" height="20" rx="3" fill="#64B5F6" opacity="0.7" stroke="#1976D2" strokeWidth="1" />
              <rect x="2" y="14" width="14" height="10" fill="#5D4037" />
              {/* Mint Sprouts */}
              <path d="M 9,14 Q 3,4 7,2 Q 13,4 9,14 Z" fill="#4CAF50" />
              <path d="M 9,14 Q 15,6 17,4 Q 17,11 9,14 Z" fill="#81C784" />
            </g>

            {/* Upcycled Bottle Planter 2 (Chili Plant) */}
            <g transform="translate(210, 88)">
              <rect x="0" y="18" width="20" height="20" rx="3" fill="#81C784" opacity="0.8" stroke="#388E3C" strokeWidth="1" />
              <rect x="2" y="20" width="16" height="10" fill="#5D4037" />
              {/* Plant Stem & Leaf */}
              <line x1="10" y1="20" x2="10" y2="6" stroke="#2E7D32" strokeWidth="2" />
              <path d="M 10,12 Q 3,8 5,6 Q 10,8 10,12 Z" fill="#4CAF50" />
              <path d="M 10,8 Q 17,4 16,2 Q 12,5 10,8 Z" fill="#66BB6A" />
              {/* Tiny red chili */}
              <path d="M 10,10 Q 14,14 13,16" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Recycling Scrap Bag */}
            <g transform="translate(238, 110)">
              <path d="M 0,22 Q 3,0 15,0 Q 27,0 30,22 Q 28,36 15,36 Q 2,36 0,22 Z" fill="#E0F2F1" stroke="#00897B" strokeWidth="1.5" />
              <text x="7" y="24" fontSize="14">♻️</text>
            </g>
          </g>
        )}

        {/* Character (Student / Citizen) */}
        <g transform="translate(315, 68)">
          {/* Shadow */}
          <ellipse cx="25" cy="115" rx="16" ry="5" fill="rgba(0,0,0,0.18)" />

          {/* Legs & Trousers */}
          <rect x="16" y="70" width="8" height="42" fill="#37474F" />
          <rect x="26" y="70" width="8" height="42" fill="#37474F" />
          {/* Shoes */}
          <ellipse cx="19" cy="113" rx="5" ry="3" fill="#212121" />
          <ellipse cx="31" cy="113" rx="5" ry="3" fill="#212121" />

          {/* T-Shirt */}
          <path
            d="M 12,38 L 8,72 L 42,72 L 38,38 Z"
            fill={isBurning ? '#78909C' : '#2E9E5B'}
          />

          {/* Arms */}
          {isBurning ? (
            /* Holding nose/coughing */
            <g stroke="#FFCC80" strokeWidth="4" strokeLinecap="round">
              <line x1="12" y1="44" x2="22" y2="30" />
              <line x1="38" y1="44" x2="26" y2="30" />
            </g>
          ) : isSustainable ? (
            /* Thumbs up / celebrating */
            <g stroke="#FFCC80" strokeWidth="4" strokeLinecap="round">
              <line x1="12" y1="44" x2="3" y2="28" />
              <line x1="38" y1="44" x2="47" y2="28" />
            </g>
          ) : (
            /* Holding empty bottle in hand */
            <g>
              <line x1="12" y1="44" x2="16" y2="58" stroke="#FFCC80" strokeWidth="4" strokeLinecap="round" />
              <line x1="38" y1="44" x2="28" y2="56" stroke="#FFCC80" strokeWidth="4" strokeLinecap="round" />
              {/* Bottle in hand */}
              <rect x="24" y="52" width="7" height="14" rx="2" fill="url(#bottleGrad)" stroke="#1E88E5" strokeWidth="1" />
            </g>
          )}

          {/* Head & Neck */}
          <rect x="22" y="26" width="6" height="8" fill="#FFCC80" />
          <circle cx="25" cy="18" r="11" fill="#FFCC80" />

          {/* Hair */}
          <path d="M 14,16 Q 25,5 36,16 Q 36,10 25,9 Q 15,10 14,16 Z" fill="#3E2723" />

          {/* Face */}
          {isBurning ? (
            /* Coughing cloth */
            <g>
              <circle cx="21" cy="16" r="1.5" fill="#212121" />
              <circle cx="28" cy="16" r="1.5" fill="#212121" />
              <rect x="18" y="20" width="14" height="6" rx="3" fill="#FFFFFF" opacity="0.9" />
            </g>
          ) : (
            /* Smiling face */
            <g>
              <circle cx="21" cy="16" r="1.5" fill="#212121" />
              <circle cx="28" cy="16" r="1.5" fill="#212121" />
              <path d="M 21,21 Q 25,24 29,21" stroke="#3E2723" strokeWidth="1.5" fill="none" />
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
            ? 'rgba(217, 83, 79, 0.95)'
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
        <span>
          {isBurning
            ? '🔥 Toxic Smog Burning'
            : isSustainable
            ? '🌱 Upcycled & Recycled'
            : '🧴 Empty Bottle at Home'}
        </span>
      </div>
    </div>
  )
}
