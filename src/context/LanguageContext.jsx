import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import translationsData from '../data/translations.json'
import { safeStorage } from '../utils/safeStorage'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = safeStorage.getItem('wes_language')
      if (stored && ['en', 'te', 'hi'].includes(stored)) {
        return stored
      }
    } catch {
      // safe fallback
    }
    return 'en'
  })

  const setLanguage = useCallback((langCode) => {
    const valid = ['en', 'te', 'hi'].includes(langCode) ? langCode : 'en'
    setLanguageState(valid)
    try {
      safeStorage.setItem('wes_language', valid)
    } catch {
      // safe fallback
    }
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'en' ? 'te' : prev === 'te' ? 'hi' : 'en'
      try {
        safeStorage.setItem('wes_language', next)
      } catch {}
      return next
    })
  }, [])

  useEffect(() => {
    document.body.classList.toggle('lang-te', language === 'te')
    document.body.classList.toggle('lang-hi', language === 'hi')
    document.documentElement.lang = language
  }, [language])

  // Safe nested key resolver e.g. t('header.points')
  const t = useCallback((keyPath, fallback = '') => {
    const keys = keyPath.split('.')
    const currentLangDict = translationsData[language] || translationsData.en

    // Try current language first
    let val = currentLangDict
    let found = true
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k]
      } else {
        found = false
        break
      }
    }
    if (found && typeof val === 'string') return val

    // Fall back to English
    let enVal = translationsData.en
    for (const k of keys) {
      if (enVal && typeof enVal === 'object' && k in enVal) {
        enVal = enVal[k]
      } else {
        return fallback || keyPath
      }
    }
    return typeof enVal === 'string' ? enVal : (fallback || keyPath)
  }, [language])

  // Helper for localized object properties { en: "...", te: "...", hi: "..." }
  const getLocalized = useCallback((obj) => {
    if (!obj) return ''
    if (typeof obj === 'string') return obj
    return obj[language] || obj.en || ''
  }, [language])

  return (
    <LanguageContext.Provider value={{
      lang: language,
      language,
      setLang: setLanguage,
      setLanguage,
      toggleLanguage,
      t,
      getLocalized
    }}>
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
