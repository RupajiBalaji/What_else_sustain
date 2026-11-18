import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import quizQuestions from '../../data/quiz.json'
import {
  evaluateQuizComparison,
  buildQuizAnalyticsPayload,
  shuffleQuestions
} from '../../utils/quizAnalytics'
import { sound } from '../../game/soundManager'
import { safeStorage } from '../../utils/safeStorage'

const QUIZ_STORAGE_KEY = 'wes_quiz_sessions_v1'

export default function QuizModal({
  isOpen,
  mode = 'pre', // 'pre' | 'post' | 'results'
  onComplete,
  onSkip
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const [answers, setAnswers] = useState({})
  const [startTime] = useState(() => Date.now())
  const [viewState, setViewState] = useState(mode) // 'pre' | 'post' | 'results'

  // Load existing pre-answers from local storage if available for comparison
  const [storedPreAnswers, setStoredPreAnswers] = useState(() => {
    try {
      const raw = safeStorage.getItem(QUIZ_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed?.preAnswers || {}
      }
    } catch {
      // safe fallback
    }
    return {}
  })

  // Pre-check uses 2 core baseline questions; Post-check uses 3 questions for depth
  const questions = useMemo(() => {
    if (mode === 'pre') {
      return quizQuestions.slice(0, 2)
    }
    if (mode === 'post') {
      return quizQuestions.slice(0, 3)
    }
    return quizQuestions
  }, [mode])

  // Sync viewState when mode prop updates
  useEffect(() => {
    setViewState(mode)
    setCurrentIndex(0)
    setSelectedOptionId(null)
    setAnswers({})
  }, [mode])

  // Keyboard navigation: 1-4 to select option, Enter to proceed
  useEffect(() => {
    if (!isOpen || viewState === 'results') return

    const handleKeyDown = (e) => {
      const currentQ = questions[currentIndex]
      if (!currentQ) return

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1
        if (currentQ.options[idx]) {
          sound.initAudio()
          sound.playTap()
          setSelectedOptionId(currentQ.options[idx].id)
        }
      } else if (e.key === 'Enter' && selectedOptionId) {
        e.preventDefault()
        handleNextQuestion()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, viewState, currentIndex, selectedOptionId, questions])

  if (!isOpen) return null

  const currentQ = questions[currentIndex]

  const handleSelectOption = (optId) => {
    sound.initAudio()
    sound.playTap()
    setSelectedOptionId(optId)
  }

  const handleNextQuestion = () => {
    if (!selectedOptionId || !currentQ) return

    sound.initAudio()
    sound.playCoin()

    const updatedAnswers = { ...answers, [currentQ.id]: selectedOptionId }
    setAnswers(updatedAnswers)
    setSelectedOptionId(null)

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      // Finished all 5 questions
      const durationMs = Date.now() - startTime
      if (viewState === 'pre') {
        // Save pre-answers to storage
        try {
          const sessionPayload = {
            preAnswers: updatedAnswers,
            preDurationMs: durationMs,
            updatedAt: new Date().toISOString()
          }
          safeStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(sessionPayload))
          setStoredPreAnswers(updatedAnswers)
        } catch {
          // safe fallback
        }
        onComplete?.({ mode: 'pre', answers: updatedAnswers, durationMs })
      } else if (viewState === 'post') {
        // Build comparison and transition to results view
        try {
          const raw = safeStorage.getItem(QUIZ_STORAGE_KEY)
          const existing = raw ? JSON.parse(raw) : {}
          const preAns = existing?.preAnswers || storedPreAnswers || {}
          const analyticsPayload = buildQuizAnalyticsPayload({
            preSession: { answers: preAns, durationMs: existing?.preDurationMs || 0 },
            postSession: { answers: updatedAnswers, durationMs },
            questions: quizQuestions
          })
          safeStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ ...existing, ...analyticsPayload, postAnswers: updatedAnswers }))
        } catch {
          // safe fallback
        }
        setViewState('results')
      }
    }
  }

  const handleConfirmSkip = () => {
    sound.initAudio()
    sound.playTap()
    onSkip?.({ mode: viewState, skipped: true })
  }

  // Results View Calculation
  const evaluation = viewState === 'results' ? evaluateQuizComparison({
    preAnswers: storedPreAnswers,
    postAnswers: answers,
    questions: quizQuestions
  }) : null

  return (
    <div
      data-testid="quiz-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 145,
        backgroundColor: 'rgba(10, 15, 20, 0.90)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
        pointerEvents: 'auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: 'rgba(20, 26, 32, 0.96)',
          borderRadius: '20px',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          color: '#FFFFFF',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* RESULTS VIEW */}
        {viewState === 'results' && evaluation && (
          <div data-testid="quiz-results-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>📊</span>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#A5D6A7', margin: 0 }}>
                    Learning Impact Results
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: '#B0BEC5', marginTop: '2px' }}>
                    Comparing before vs after field exploration
                  </div>
                </div>
              </div>
            </div>

            {/* Score Comparison Box */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                textAlign: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: '#90A4AE', textTransform: 'uppercase', fontWeight: 800 }}>
                  Pre-Check
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF' }}>
                  {evaluation.preScore} / {evaluation.preTotal || 2}
                </div>
              </div>

              <div style={{ fontSize: '1.4rem', color: '#81C784', fontWeight: 900 }}>
                ➔
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#90A4AE', textTransform: 'uppercase', fontWeight: 800 }}>
                  Post-Check
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#A5D6A7' }}>
                  {evaluation.postScore} / {evaluation.postTotal || 3}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: evaluation.improvementScore > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${evaluation.improvementScore > 0 ? '#81C784' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  color: evaluation.improvementScore > 0 ? '#A5D6A7' : '#B0BEC5'
                }}
              >
                {evaluation.improvementScore > 0 ? `+${evaluation.improvementScore}% Gain` : `${evaluation.improvementScore}% Gain`}
              </div>
            </div>

            {/* Feedback Message */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(46, 125, 50, 0.14)',
                border: '1px solid rgba(129, 199, 132, 0.3)',
                borderRadius: '10px',
                fontSize: '0.82rem',
                color: '#E8F5E9',
                lineHeight: 1.45,
                fontWeight: 600
              }}
            >
              {evaluation.feedbackMessage}
            </div>

            {/* Concepts Learned List */}
            {evaluation.conceptsLearned.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', color: '#A5D6A7', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Key Concepts Mastered ({evaluation.conceptsLearned.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {evaluation.conceptsLearned.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.76rem',
                        color: '#CFD8DC',
                        lineHeight: 1.4
                      }}
                    >
                      <strong style={{ color: '#81C784' }}>✓ {c.concept.replace(/_/g, ' ')}:</strong> {c.explanation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action button to finish */}
            <button
              data-testid="finish-quiz-results-btn"
              onClick={() => onComplete?.({ mode: 'results', evaluation })}
              style={{
                width: '100%',
                minHeight: '48px',
                backgroundColor: '#2E7D32',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(46, 125, 50, 0.4)',
                marginTop: '8px'
              }}
            >
              Continue Farming ➔
            </button>
          </div>
        )}

        {/* QUESTION VIEW (Pre or Post) */}
        {viewState !== 'results' && currentQ && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Top Bar with Mode and Progress */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '0.70rem', textTransform: 'uppercase', color: '#81C784', fontWeight: 900, letterSpacing: '0.04em' }}>
                  {viewState === 'pre' ? '🌾 Knowledge Pre-Check' : '🌱 Knowledge Post-Check'}
                </span>
                <div style={{ fontSize: '0.78rem', color: '#90A4AE', marginTop: '1px' }}>
                  Question {currentIndex + 1} of {questions.length}
                </div>
              </div>

              {/* Progress Indicator Dots */}
              <div style={{ display: 'flex', gap: '5px' }}>
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: idx === currentIndex ? '#81C784' : idx < currentIndex ? '#2E7D32' : 'rgba(255,255,255,0.2)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Question Text */}
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.45, margin: '4px 0' }}>
              {currentQ.question}
            </h3>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = selectedOptionId === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`quiz-option-${oIdx}`}
                    onClick={() => handleSelectOption(opt.id)}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      padding: '12px 14px',
                      backgroundColor: isSelected ? 'rgba(46, 125, 50, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1.5px solid ${isSelected ? '#81C784' : 'rgba(255, 255, 255, 0.12)'}`,
                      borderRadius: '12px',
                      color: isSelected ? '#FFFFFF' : '#CFD8DC',
                      textAlign: 'left',
                      fontSize: '0.84rem',
                      lineHeight: 1.4,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'border-color 0.15s, background-color 0.15s'
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#81C784' : 'rgba(255, 255, 255, 0.1)',
                        color: isSelected ? '#16382B' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        flexShrink: 0
                      }}
                    >
                      {oIdx + 1}
                    </span>
                    <span style={{ flex: 1 }}>{opt.text}</span>
                  </button>
                )
              })}
            </div>

            {/* Controls: Next Question & Skip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleConfirmSkip}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#90A4AE',
                  fontSize: '0.75rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                Skip for now
              </button>

              <button
                type="button"
                data-testid="quiz-next-button"
                disabled={!selectedOptionId}
                onClick={handleNextQuestion}
                style={{
                  minHeight: '44px',
                  padding: '0 24px',
                  backgroundColor: selectedOptionId ? '#2E7D32' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedOptionId ? '#FFFFFF' : '#78909C',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: selectedOptionId ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{currentIndex + 1 === questions.length ? (viewState === 'pre' ? 'Complete Pre-Check' : 'See Results') : 'Next'}</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
