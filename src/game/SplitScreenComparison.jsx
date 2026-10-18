/**
 * SplitScreenComparison.jsx
 * Split-screen interactive comparison slider between Burned Future vs Sustainable Future.
 * Features draggable or tap slider divider, side-by-side metric comparison,
 * and transition to final scorecard & pledge.
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { sound } from './soundManager'

export default function SplitScreenComparison({
  chosenAlternative,
  onProceedToPledge,
  lang = 'en'
}) {
  // Slider position from 0 (all sustainable) to 100 (all burned), default 50%
  const [sliderPos, setSliderPos] = useState(50)

  const handleSliderChange = (e) => {
    setSliderPos(Number(e.target.value))
  }

  const altTitle = chosenAlternative?.text?.[lang] || chosenAlternative?.text?.en || 'Sustainable Choice'

  return (
    <div className="splitscreen-modal-container">
      <div className="splitscreen-card">
        {/* Header */}
        <div className="splitscreen-header">
          <span className="split-badge">⚖️ {lang === 'te' ? 'భవిష్యత్ పోలిక' : 'The Two Futures'}</span>
          <h2 className="split-title">
            {lang === 'te' ? 'మీ నిర్ణయం గ్రామాన్ని ఎలా మార్చింది?' : 'How Your Decision Shapes the Village'}
          </h2>
          <p className="split-subtitle">
            {lang === 'te'
              ? 'స్లైడర్‌ను లాగి కాలుష్య పరిణామాలు మరియు సుస్థిర ప్రయోజనాలను సరిపోల్చండి:'
              : 'Drag the slider to compare the smoky aftermath with the restored ecosystem:'}
          </p>
        </div>

        {/* Visual Slider Viewport */}
        <div className="split-viewport">
          {/* Left / Top Side: Burned Mistake */}
          <div
            className="split-panel split-burned"
            style={{ width: `${sliderPos}%` }}
          >
            <div className="panel-inner">
              <div className="panel-tag burned-tag">
                <span>🔥 {lang === 'te' ? 'కాల్చిన భవిష్యత్తు (-25% ఆరోగ్యం)' : 'Burned Path (-25% Nature Health)'}</span>
              </div>
              <ul className="split-facts-list">
                <li>🌫️ {lang === 'te' ? 'దట్టమైన విష పొగ & శ్వాసకోశ సమస్యలు' : 'Thick PM2.5 smoke blankets village children'}</li>
                <li>🪱 {lang === 'te' ? '70°C వేడికి నేలలోని వానపాములు, పోషకాలు మృతి' : 'Beneficial soil microbes & organic nitrogen vaporized'}</li>
                <li>💸 {lang === 'te' ? 'ఎకరానికి ₹3,000+ అదనపు రసాయన ఎరువుల ఖర్చు' : '₹3,000+ extra spending on synthetic fertilizers next month'}</li>
              </ul>
            </div>
          </div>

          {/* Right / Bottom Side: Sustainable Choice */}
          <div
            className="split-panel split-sustainable"
            style={{ width: `${100 - sliderPos}%`, left: `${sliderPos}%` }}
          >
            <div className="panel-inner">
              <div className="panel-tag sustainable-tag">
                <span>🌱 {altTitle} (+25% {lang === 'te' ? 'ఆరోగ్యం' : 'Nature Health'})</span>
              </div>
              <ul className="split-facts-list">
                <li>🌾 {lang === 'te' ? 'నేలలో 20% తేమ నిల్వ, నీటి ఆదా' : '20% ground moisture retained, saves irrigation'}</li>
                <li>💧 {lang === 'te' ? 'స్వచ్ఛమైన గాలి & పరిశుభ్రమైన గ్రామీణ నది' : 'Clean breathable air & crystal village river'}</li>
                <li>💰 {lang === 'te' ? 'ఎరువుల ఖర్చు ఆదా / అదనపు నగదు లాభం' : 'Saves fertilizer costs and unlocks cash profit'}</li>
              </ul>
            </div>
          </div>

          {/* Draggable Divider Line */}
          <div className="split-divider-line" style={{ left: `${sliderPos}%` }}>
            <div className="divider-handle">
              <span>◀ ❚❚ ▶</span>
            </div>
          </div>

          {/* Real Input Range overlay */}
          <input
            type="range"
            min="5"
            max="95"
            value={sliderPos}
            onChange={handleSliderChange}
            className="split-range-input"
            aria-label="Split Screen Future Comparison Slider"
          />
        </div>

        {/* Action Button: Proceed to Pledge */}
        <motion.button
          type="button"
          onClick={() => {
            sound.playSuccessChime()
            onProceedToPledge()
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="start-action-btn split-action-btn"
        >
          <span>{lang === 'te' ? 'ప్రతిజ్ఞ చేయండి & బ్యాడ్జ్ పొందండి 🤝' : 'Take the Village Pledge & Claim Badge 🤝'}</span>
          <span aria-hidden="true">→</span>
        </motion.button>
      </div>
    </div>
  )
}
