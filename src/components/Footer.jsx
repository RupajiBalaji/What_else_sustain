import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'

// Paste your Google Form or survey link here:
const FEEDBACK_FORM_URL = 'https://forms.gle/REPLACE_ME'

export default function Footer() {
  const { t } = useLanguage()
  const { resetProgress } = useGame()

  return (
    <footer className="app-footer">
      <p className="footer-quote">"{t('footer.tagline')}"</p>
      <p>{t('footer.offlineNote')}</p>
      
      {/* Actions: Feedback & Reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-feedback-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            padding: '8px 16px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--color-deep-green)',
            textDecoration: 'none',
            minHeight: '44px',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          aria-label={t('footer.giveFeedback')}
        >
          <span>💬</span>
          <span>{t('footer.giveFeedback')}</span>
        </a>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset your progress and restart with fresh nature health?')) {
              resetProgress()
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            textDecoration: 'underline',
            fontSize: '0.78rem',
            cursor: 'pointer',
            padding: '10px 8px',
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          {t('footer.resetProgress')}
        </button>
      </div>
    </footer>
  )
}
