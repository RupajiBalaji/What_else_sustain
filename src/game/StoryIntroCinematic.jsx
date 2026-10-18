/**
 * StoryIntroCinematic.jsx
 * Scene 0: 20-second skippable cinematic prologue.
 * Features line-by-line typewriter narrative over a quiet, evocative golden-hour Indian village.
 * Narrator: "Every village remembers its first harvest... and its last clean sky."
 * Includes audio trigger, Start button, Skip button, and bilingual support.
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sound } from './soundManager'

export default function StoryIntroCinematic({ onStart, onSkip, lang = 'en' }) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0)

  const narrativeLines = lang === 'te'
    ? [
        'ప్రతి గ్రామానికి తన మొదటి పంట గుర్తుంది...',
        '...మరియు తన చివరి స్వచ్ఛమైన ఆకాశం కూడా.',
        'కొయ్యకాలు కాల్చడం ఒక సులభమైన నిర్ణయంగా మొదలైంది.',
        'కానీ భూమికి ప్రత్యామ్నాయం తెలుసు.',
        'తప్పు చేయండి. తెలుసుకోండి. ప్రత్యామ్నాయాన్ని ఎంచుకోండి.'
      ]
    : [
        'Every village remembers its first harvest...',
        '...and its last clean sky.',
        'Burning the straw seemed like an easy decision.',
        'Yet the earth always knew a better way.',
        'Make the mistake. Understand it. Choose what else.'
      ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLineIndex((prev) => {
        if (prev < narrativeLines.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 3800)

    return () => clearInterval(timer)
  }, [narrativeLines.length])

  const handleBegin = () => {
    sound.initAudio()
    sound.playTap()
    sound.playAmbient()
    onStart()
  }

  const handleSkipCinematic = () => {
    sound.initAudio()
    sound.playTap()
    sound.playAmbient()
    onSkip()
  }

  return (
    <div className="cinematic-intro-overlay">
      {/* Top right quick skip */}
      <button
        type="button"
        onClick={handleSkipCinematic}
        className="cinematic-skip-btn"
        aria-label="Skip Cinematic Intro"
      >
        <span>{lang === 'te' ? 'దాటవేయి ⏭️' : 'Skip Intro ⏭️'}</span>
      </button>

      {/* Narrative Card */}
      <div className="cinematic-center-card">
        <div className="cinematic-badge">
          <span>🌾 WHAT ELSE SUSTAIN</span>
        </div>

        <div className="narrative-text-box">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentLineIndex}
              initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              className="narrative-line"
            >
              "{narrativeLines[currentLineIndex]}"
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Cinematic Progress Ticks */}
        <div className="cinematic-ticks-row">
          {narrativeLines.map((_, i) => (
            <div
              key={i}
              className={`cinematic-tick ${i <= currentLineIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Start Game Action Button */}
        <motion.button
          type="button"
          onClick={handleBegin}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="cinematic-start-btn"
        >
          <span>{lang === 'te' ? 'ఆట ప్రారంభించండి 🌾' : 'Step Into the Village 🌾'}</span>
        </motion.button>
      </div>
    </div>
  )
}
