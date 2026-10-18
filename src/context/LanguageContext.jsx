import React, { createContext, useContext, useEffect } from 'react'
import translationsData from '../data/translations.json'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const lang = 'en'
  const language = 'en'

  useEffect(() => {
    document.body.classList.remove('lang-te')
    document.documentElement.lang = 'en'
  }, [])

  const toggleLanguage = () => {
    // English-only mode: no-op
  }

  // Safe nested key resolver e.g. t('header.points')
  const t = (keyPath, fallback = '') => {
    const keys = keyPath.split('.')
    let current = translationsData.en
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        return fallback || keyPath
      }
    }
    return typeof current === 'string' ? current : fallback || keyPath
  }

  // Helper for localized object properties { en: "..." }
  const getLocalized = (obj) => {
    if (!obj) return ''
    if (typeof obj === 'string') return obj
    return obj.en || ''
  }

  return (
    <LanguageContext.Provider value={{ lang, language, setLang: () => {}, toggleLanguage, t, getLocalized }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
