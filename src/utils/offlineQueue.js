import { safeStorage } from './safeStorage.js'

const QUEUE_STORAGE_KEY = 'wes_offline_telemetry_queue_v1'

export class OfflineQueueManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || QUEUE_STORAGE_KEY
    this.apiBase = options.apiBase || ''
    this.isFlushing = false
    this.retryTimer = null

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.flushQueue().catch(() => {})
      })
    }
  }

  getQueue() {
    try {
      const raw = safeStorage.getItem(this.storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch {
      // safe fallback
    }
    return []
  }

  saveQueue(queue) {
    try {
      safeStorage.setItem(this.storageKey, JSON.stringify(queue))
    } catch {
      // safe fallback
    }
  }

  enqueue(item) {
    const queue = this.getQueue()
    const entry = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ts: new Date().toISOString(),
      ...item
    }
    queue.push(entry)
    this.saveQueue(queue)
    return entry
  }

  clearQueue() {
    this.saveQueue([])
  }

  getQueueLength() {
    return this.getQueue().length
  }

  async sendEvent(sessionId, eventType, payload = {}) {
    const item = {
      sessionId,
      eventType,
      payload,
      endpoint: `${this.apiBase}/api/sessions/${sessionId}/events`,
      body: { event_type: eventType, payload }
    }

    // If offline, queue immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.enqueue(item)
      return { status: 'queued', offline: true }
    }

    try {
      const res = await fetch(item.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body)
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      return { status: 'sent', result: await res.json() }
    } catch (err) {
      // Network failed, queue for retry
      this.enqueue(item)
      return { status: 'queued', error: err.message }
    }
  }

  async sendQuizAttempt(sessionId, attemptData) {
    const item = {
      sessionId,
      endpoint: `${this.apiBase}/api/sessions/${sessionId}/quiz`,
      body: attemptData
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.enqueue(item)
      return { status: 'queued', offline: true }
    }

    try {
      const res = await fetch(item.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body)
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      return { status: 'sent', result: await res.json() }
    } catch (err) {
      this.enqueue(item)
      return { status: 'queued', error: err.message }
    }
  }

  async flushQueue(customFetch = null) {
    if (this.isFlushing) return 0
    const queue = this.getQueue()
    if (queue.length === 0) return 0

    this.isFlushing = true
    const remaining = []
    let sentCount = 0
    const fetchFn = customFetch || (typeof fetch !== 'undefined' ? fetch : null)

    if (!fetchFn) {
      this.isFlushing = false
      return 0
    }

    for (const item of queue) {
      try {
        const res = await fetchFn(item.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body)
        })
        if (res.ok) {
          sentCount++
        } else {
          remaining.push(item)
        }
      } catch {
        remaining.push(item)
      }
    }

    this.saveQueue(remaining)
    this.isFlushing = false
    return sentCount
  }
}

export const offlineQueue = new OfflineQueueManager()
