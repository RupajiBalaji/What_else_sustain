import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'

export default function Footer() {
  const { t } = useLanguage()
  const { resetProgress } = useGame()

  return (
    <footer className="app-footer">
      <p className="footer-quote">"{t('footer.tagline')}"</p>
      <p>{t('footer.offlineNote')}</p>
      <div>
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
            fontSize: '0.75rem',
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          {t('footer.resetProgress')}
        </button>
      </div>
    </footer>
  )
}
