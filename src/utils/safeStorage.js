/**
 * safeStorage: Safe abstraction over localStorage
 * Protects against Private Browsing restrictions, quota exceeded errors,
 * or disabled storage in restricted mobile WebViews.
 */

const memoryStore = new Map()

export const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key)
      }
    } catch (err) {
      console.warn(`[safeStorage] localStorage.getItem failed for "${key}":`, err)
    }
    return memoryStore.has(key) ? memoryStore.get(key) : null
  },

  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value)
        return
      }
    } catch (err) {
      console.warn(`[safeStorage] localStorage.setItem failed for "${key}":`, err)
    }
    memoryStore.set(key, String(value))
  },

  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key)
      }
    } catch (err) {
      console.warn(`[safeStorage] localStorage.removeItem failed for "${key}":`, err)
    }
    memoryStore.delete(key)
  },

  clear: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear()
      }
    } catch (err) {
      console.warn('[safeStorage] localStorage.clear failed:', err)
    }
    memoryStore.clear()
  }
}
