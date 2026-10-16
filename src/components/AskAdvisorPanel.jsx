import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { getOfflineAnswer } from '../data/aiOfflineKnowledge'

export default function AskAdvisorPanel({ onClose }) {
  const { t, lang } = useLanguage()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: lang === 'te'
        ? 'నమస్కారం! నేను "వాట్ ఎల్స్ సస్టైన్" AI సలహాదారుని. పర్యావరణ పరిరక్షణ, పంట వ్యర్థాల నిర్వహణ లేదా ప్లాస్టిక్ పునర్వినియోగం గురించి ఏదైనా ప్రశ్న అడగండి.'
        : 'Hello! I am your "What Else Sustain" AI Advisor. Ask any practical question about managing crop straw, home plastic waste, or eco-friendly alternatives.',
      source: 'system'
    }
  ])
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Sample prompt chips
  const samplePrompts = lang === 'te'
    ? [
        'నా దగ్గర 5 ఎకరాల వరి గడ్డి ఉంది, ఏం చేయగలను?',
        'ఇంట్లో ప్లాస్టిక్ బాటిళ్లను ఎలా పునర్వినియోగించాలి?',
        'తక్కువ ఖర్చుతో కిచెన్ కంపోస్ట్ ఎలా తయారు చేయాలి?'
      ]
    : [
        'I have 5 acres of paddy straw, what can I do?',
        'How can I reuse old plastic bottles at home?',
        'Best low-cost organic kitchen composting method?'
      ]

  const handleAsk = async (textToAsk) => {
    const question = (textToAsk || query).trim()
    if (!question || loading) return

    // Append user message
    const userMsg = { role: 'user', text: question }
    setMessages((prev) => [...prev, userMsg])
    setQuery('')
    setLoading(true)

    try {
      // Call backend serverless endpoint
      const response = await fetch('/api/ask-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question, lang })
      })

      if (!response.ok) {
        throw new Error('Endpoint unreachable')
      }

      const data = await response.json()

      if (data.answer && data.source === 'gemini') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.answer, source: 'gemini' }
        ])
      } else {
        // Fallback triggered gracefully
        const offlineText = getOfflineAnswer(question, lang)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: offlineText,
            source: 'offline',
            note: lang === 'te'
              ? '🛡️ ఆఫ్‌లైన్ నాలెడ్జ్ బేస్ నుండి ధృవీకరించిన సమాధానం'
              : '🛡️ Verified answer from Offline Knowledge Base'
          }
        ])
      }
    } catch {
      // Network failure or offline browser
      const offlineText = getOfflineAnswer(question, lang)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: offlineText,
          source: 'offline',
          note: lang === 'te'
            ? '🛡️ ఆఫ్‌లైన్ మోడ్ (నెట్‌వర్క్ లేనప్పుడు కూడా అందుబాటులో ఉంది)'
            : '🛡️ Offline Mode (Active without internet)'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Voice speech-to-text handler
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert(lang === 'te' ? 'మీ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ అందుబాటులో లేదు.' : 'Voice recognition is not supported in this browser.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = lang === 'te' ? 'te-IN' : 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setQuery(transcript)
        handleAsk(transcript)
      }

      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 61, 46, 0.72)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 250,
        backdropFilter: 'blur(3px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-card-bg)',
          width: '100%',
          maxWidth: '540px',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '16px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          height: '86vh',
          maxHeight: '700px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.6rem', background: 'rgba(46, 158, 91, 0.12)', padding: '6px', borderRadius: '50%' }}>
              🤖
            </span>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-deep-green)' }}>
                {t('advisor.title')}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-leaf-green)', fontWeight: 700 }}>
                {t('advisor.subtitle')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('advisor.close')}
            style={{
              background: 'var(--color-surface-subtle)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Message Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {messages.map((m, idx) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={idx}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  background: isUser ? 'var(--color-deep-green)' : 'var(--color-surface-subtle)',
                  color: isUser ? '#FFFFFF' : 'var(--color-text-main)',
                  padding: '12px 14px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '0.86rem',
                  lineHeight: 1.5,
                  wordBreak: 'break-word'
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                {m.note && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '6px', borderTop: '1px dashed var(--color-border)', paddingTop: '4px' }}>
                    {m.note}
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: 'var(--color-surface-subtle)',
                padding: '10px 14px',
                borderRadius: '16px',
                fontSize: '0.82rem',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="pulse-dot">🌱</span>
              <span>{t('advisor.thinking')}...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ padding: '6px 0', display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {samplePrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => handleAsk(prompt)}
              style={{
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-full)',
                padding: '5px 10px',
                fontSize: '0.72rem',
                color: 'var(--color-deep-green)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              💡 {prompt}
            </button>
          ))}
        </div>

        {/* Query Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAsk()
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--color-border)'
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('advisor.inputPlaceholder')}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-bg)',
              fontSize: '0.88rem',
              color: 'var(--color-text-main)',
              outline: 'none'
            }}
          />

          {/* Voice Mic Button */}
          {speechSupported && (
            <button
              type="button"
              onClick={handleToggleVoice}
              aria-label={isListening ? 'Stop listening' : 'Start speaking'}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: 'none',
                background: isListening ? 'var(--color-harm-red)' : 'var(--color-surface-subtle)',
                color: isListening ? '#FFFFFF' : 'var(--color-deep-green)',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: isListening ? '0 0 10px rgba(217, 83, 79, 0.6)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isListening ? '🛑' : '🎙️'}
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!query.trim() || loading}
            aria-label={t('advisor.send')}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              background: query.trim() && !loading ? 'var(--color-leaf-green)' : '#C4BEB0',
              color: '#FFFFFF',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: query.trim() && !loading ? 'pointer' : 'default',
              flexShrink: 0
            }}
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  )
}
