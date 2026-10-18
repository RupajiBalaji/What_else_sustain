import React from 'react'
import { motion } from 'framer-motion'
import { sound } from './soundManager'

/**
 * SproutMascot - Leaf-sprout kid mascot for "What Else Sustain"
 * Expressions: 'happy' | 'worried' | 'cheering' | 'thinking'
 * Sizes: 'sm' (60px) | 'md' (96px) | 'lg' (130px)
 */
export default function SproutMascot({
  expression = 'happy',
  speech = null,
  size = 'md',
  bubblePosition = 'top', // 'top' | 'right' | 'left'
  className = '',
  onClick = null
}) {
  const sizeMap = {
    sm: { width: 64, height: 72 },
    md: { width: 96, height: 108 },
    lg: { width: 130, height: 146 }
  }

  const { width, height } = sizeMap[size] || sizeMap.md

  const handleTap = (e) => {
    sound.initAudio()
    sound.playPop()
    if (onClick) onClick(e)
  }

  // Expression-specific SVG parts
  const renderEyes = () => {
    switch (expression) {
      case 'worried':
        return (
          <g id="sprout-eyes-worried">
            {/* Worried tilted eyebrows */}
            <path d="M 32 44 Q 38 41 44 45" stroke="#16382B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 56 45 Q 62 41 68 44" stroke="#16382B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Wide anxious pupils */}
            <circle cx="38" cy="50" r="4.5" fill="#16382B" />
            <circle cx="62" cy="50" r="4.5" fill="#16382B" />
            <circle cx="37" cy="48" r="1.5" fill="#FFFFFF" />
            <circle cx="61" cy="48" r="1.5" fill="#FFFFFF" />
            {/* Sweat drop */}
            <path d="M 72 40 C 70 42 70 46 72 48 C 74 46 74 42 72 40 Z" fill="#4FC3F7" />
          </g>
        )
      case 'cheering':
        return (
          <g id="sprout-eyes-cheering">
            {/* Happy laughing closed eyes */}
            <path d="M 32 50 Q 38 42 44 50" stroke="#16382B" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 56 50 Q 62 42 68 50" stroke="#16382B" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Sparkle stars */}
            <polygon points="26,42 27,45 30,45 28,47 29,50 26,48 24,50 25,47 23,45 26,45" fill="#FFD54F" />
            <polygon points="74,42 75,45 78,45 76,47 77,50 74,48 72,50 73,47 71,45 74,45" fill="#FFD54F" />
          </g>
        )
      case 'thinking':
        return (
          <g id="sprout-eyes-thinking">
            {/* One raised eyebrow, one flat */}
            <path d="M 32 42 Q 38 40 44 43" stroke="#16382B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 56 46 Q 62 45 68 46" stroke="#16382B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Looking up-right */}
            <circle cx="40" cy="48" r="4.5" fill="#16382B" />
            <circle cx="64" cy="48" r="4.5" fill="#16382B" />
            <circle cx="41" cy="46" r="1.8" fill="#FFFFFF" />
            <circle cx="65" cy="46" r="1.8" fill="#FFFFFF" />
          </g>
        )
      case 'happy':
      default:
        return (
          <g id="sprout-eyes-happy">
            {/* Big sparkling cartoon eyes */}
            <ellipse cx="38" cy="49" rx="5" ry="5.5" fill="#16382B" />
            <ellipse cx="62" cy="49" rx="5" ry="5.5" fill="#16382B" />
            {/* Catchlights */}
            <circle cx="36.5" cy="47" r="2.2" fill="#FFFFFF" />
            <circle cx="60.5" cy="47" r="2.2" fill="#FFFFFF" />
            <circle cx="40" cy="52" r="1.2" fill="#FFFFFF" />
            <circle cx="64" cy="52" r="1.2" fill="#FFFFFF" />
          </g>
        )
    }
  }

  const renderMouth = () => {
    switch (expression) {
      case 'worried':
        return (
          <g id="sprout-mouth-worried">
            <ellipse cx="50" cy="62" rx="4.5" ry="5.5" fill="#B71C1C" />
            <path d="M 46 60 Q 50 58 54 60" stroke="#7F0000" strokeWidth="1" fill="none" />
          </g>
        )
      case 'cheering':
        return (
          <g id="sprout-mouth-cheering">
            {/* Big joyful open mouth */}
            <path d="M 40 58 Q 50 72 60 58 Z" fill="#D32F2F" />
            <path d="M 44 64 Q 50 67 56 64" fill="#FF8A80" />
            {/* Two cute teeth */}
            <rect x="47" y="58" width="6" height="3" rx="1.5" fill="#FFFFFF" />
          </g>
        )
      case 'thinking':
        return (
          <g id="sprout-mouth-thinking">
            <path d="M 47 62 Q 52 64 56 61" stroke="#16382B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        )
      case 'happy':
      default:
        return (
          <g id="sprout-mouth-happy">
            <path d="M 42 58 Q 50 67 58 58" stroke="#16382B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 44 59 Q 50 66 56 59 Z" fill="#EF5350" opacity="0.8" />
          </g>
        )
    }
  }

  const renderArms = () => {
    if (expression === 'cheering') {
      return (
        <g id="sprout-arms-cheering">
          {/* Arms up high celebrating */}
          <path d="M 26 62 Q 14 50 18 38" stroke="#4CAF50" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <circle cx="18" cy="38" r="4.5" fill="#81C784" />
          <path d="M 74 62 Q 86 50 82 38" stroke="#4CAF50" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <circle cx="82" cy="38" r="4.5" fill="#81C784" />
        </g>
      )
    }
    if (expression === 'thinking') {
      return (
        <g id="sprout-arms-thinking">
          <path d="M 26 64 Q 20 72 26 78" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* Hand on chin */}
          <path d="M 74 64 Q 70 66 58 64" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="58" cy="64" r="3.5" fill="#81C784" />
        </g>
      )
    }
    if (expression === 'worried') {
      return (
        <g id="sprout-arms-worried">
          {/* Hands over cheeks/mouth */}
          <path d="M 26 65 Q 32 60 36 60" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="36" cy="60" r="3.5" fill="#81C784" />
          <path d="M 74 65 Q 68 60 64 60" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="64" cy="60" r="3.5" fill="#81C784" />
        </g>
      )
    }
    // Happy arms resting relaxed
    return (
      <g id="sprout-arms-happy">
        <path d="M 26 64 Q 18 70 24 78" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="24" cy="78" r="3.5" fill="#81C784" />
        <path d="M 74 64 Q 82 70 76 78" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="76" cy="78" r="3.5" fill="#81C784" />
      </g>
    )
  }

  return (
    <div
      className={`sprout-mascot-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: bubblePosition === 'top' ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
      }}
    >
      {/* Speech Bubble */}
      {speech && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          style={{
            maxWidth: '260px',
            backgroundColor: '#FFFFFF',
            color: '#16382B',
            border: '2.5px solid #2E7D32',
            borderRadius: '16px',
            padding: '8px 14px',
            fontSize: '0.88rem',
            fontWeight: 700,
            lineHeight: 1.35,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            marginBottom: bubblePosition === 'top' ? '8px' : 0,
            marginLeft: bubblePosition === 'right' ? '10px' : 0,
            marginRight: bubblePosition === 'left' ? '10px' : 0,
            position: 'relative',
            zIndex: 12,
            textAlign: 'center'
          }}
        >
          {speech}
          {/* Bubble Arrow Tail */}
          {bubblePosition === 'top' && (
            <div
              style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid #2E7D32'
              }}
            />
          )}
        </motion.div>
      )}

      {/* Interactive Mascot SVG */}
      <motion.div
        onClick={handleTap}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        animate={
          expression === 'cheering'
            ? { y: [0, -8, 0], rotate: [-2, 2, -2] }
            : expression === 'worried'
            ? { x: [-2, 2, -2, 2, 0] }
            : { y: [0, -3, 0] }
        }
        transition={{
          repeat: Infinity,
          duration: expression === 'cheering' ? 0.6 : expression === 'worried' ? 0.8 : 2.5,
          ease: 'easeInOut'
        }}
        style={{
          width,
          height,
          cursor: 'pointer',
          flexShrink: 0,
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))'
        }}
        role="img"
        aria-label={`Sprout Mascot feeling ${expression}`}
      >
        <svg
          viewBox="0 0 100 110"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Leaf Sprout Crown on Head */}
          <g id="sprout-leaves">
            {/* Left Leaf */}
            <motion.path
              d="M 50 26 C 35 15 25 24 38 32 C 45 30 48 28 50 26 Z"
              fill="#7CB342"
              stroke="#2E7D32"
              strokeWidth="1.5"
              animate={expression === 'worried' ? { rotate: -10 } : { rotate: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ transformOrigin: '50px 30px' }}
            />
            {/* Right Leaf (Main sprout) */}
            <motion.path
              d="M 50 26 C 62 8 76 18 60 30 C 54 28 52 27 50 26 Z"
              fill="#8BC34A"
              stroke="#2E7D32"
              strokeWidth="1.5"
              animate={expression === 'worried' ? { rotate: 12 } : { rotate: [4, -4, 4] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              style={{ transformOrigin: '50px 30px' }}
            />
            {/* Tiny sprout stem */}
            <path d="M 50 32 L 50 26" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="24" r="2.5" fill="#AED581" />
          </g>

          {/* Arms */}
          {renderArms()}

          {/* Sprout Head / Body (Pear shape with leafy gradient) */}
          <path
            d="M 50 28 C 30 28 24 45 25 65 C 26 82 36 92 50 92 C 64 92 74 82 75 65 C 76 45 70 28 50 28 Z"
            fill="#A5D6A7"
            stroke="#2E7D32"
            strokeWidth="3.5"
          />

          {/* Belly highlight (warm sunny green) */}
          <ellipse cx="50" cy="72" rx="16" ry="14" fill="#C8E6C9" opacity="0.9" />

          {/* Cheerful rosy cheeks */}
          <ellipse cx="32" cy="56" rx="4.5" ry="3" fill="#FF8A80" opacity="0.65" />
          <ellipse cx="68" cy="56" rx="4.5" ry="3" fill="#FF8A80" opacity="0.65" />

          {/* Eyes and Mouth based on state */}
          {renderEyes()}
          {renderMouth()}

          {/* Cute little sprout feet */}
          <ellipse cx="40" cy="94" rx="6" ry="4" fill="#66BB6A" stroke="#2E7D32" strokeWidth="2" />
          <ellipse cx="60" cy="94" rx="6" ry="4" fill="#66BB6A" stroke="#2E7D32" strokeWidth="2" />
        </svg>
      </motion.div>
    </div>
  )
}
