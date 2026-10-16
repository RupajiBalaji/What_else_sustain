import React, { createContext, useContext, useState, useEffect } from 'react'
import translationsData from '../data/translations.json'
import { safeStorage } from '../utils/safeStorage'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = safeStorage.getItem('wes_lang')
      return saved === 'te' ? 'te' : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    safeStorage.setItem('wes_lang', lang)

    if (lang === 'te') {
      document.body.classList.add('lang-te')
      document.documentElement.lang = 'te'
    } else {
      document.body.classList.remove('lang-te')
      document.documentElement.lang = 'en'
    }
  }, [lang])

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'te' : 'en'))
  }

  // Safe nested key resolver e.g. t('header.points')
  const t = (keyPath, fallback = '') => {
    const keys = keyPath.split('.')
    let current = translationsData[lang]
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        // Fallback to English if missing in target lang
        let enCurrent = translationsData.en
        for (const ek of keys) {
          if (enCurrent && typeof enCurrent === 'object' && ek in enCurrent) {
            enCurrent = enCurrent[ek]
          } else {
            return fallback || keyPath
          }
        }
        return typeof enCurrent === 'string' ? enCurrent : fallback || keyPath
      }
    }
    return typeof current === 'string' ? current : fallback || keyPath
  }

  // Helper for localized object properties { en: "...", te: "..." }
  const getLocalized = (obj) => {
    if (!obj) return ''
    if (typeof obj === 'string') return obj
    return obj[lang] || obj.en || ''
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t, getLocalized }}>
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
