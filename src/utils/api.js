/**
 * api.js - Resilient API fetch wrapper for What Else Sustain.
 * Features:
 * - 6-second strict request timeout (AbortController)
 * - Automatic graceful fallback when the backend is unreachable
 * - Zero game crashes if network/backend is offline
 */

const API_TIMEOUT_MS = 6000

/**
 * Low-level fetch wrapper with 6-second timeout.
 * Returns parsed JSON or throws an error on timeout/network failure.
 */
export async function apiFetch(endpoint, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  const config = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  }

  try {
    const response = await fetch(endpoint, config)
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      const error = new Error(`HTTP ${response.status}: ${errorBody || response.statusText}`)
      error.status = response.status
      throw error
    }

    return await response.json()
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Request timed out after 6 seconds')
      timeoutError.isTimeout = true
      throw timeoutError
    }
    throw err
  }
}

/**
 * Health check
 */
export async function checkBackendHealth() {
  try {
    return await apiFetch('/api/health')
  } catch {
    return { status: 'offline' }
  }
}

/**
 * Ask AI Advisor (/api/advisor)
 * Returns { answer, source, fallbackNeeded, message }
 * Never throws - returns fallbackNeeded: true if unreachable.
 */
export async function askAdvisorApi(prompt, lang = 'en') {
  try {
    const data = await apiFetch('/api/advisor', {
      method: 'POST',
      body: JSON.stringify({ prompt, lang })
    })
    return data
  } catch (err) {
    return {
      fallbackNeeded: true,
      source: 'offline',
      message: err.isTimeout
        ? 'AI request timed out; using offline knowledge base.'
        : 'Backend unreachable; using offline knowledge base.'
    }
  }
}

/**
 * Simulate Smoke Plume (/api/simulate/smoke)
 */
export async function simulateSmokeApi({
  acres,
  windSpeedMs,
  windDirDeg,
  distanceToVillageM,
  burnMinutes
}) {
  return await apiFetch('/api/simulate/smoke', {
    method: 'POST',
    body: JSON.stringify({
      acres: Number(acres),
      wind_speed_ms: Number(windSpeedMs),
      wind_dir_deg: Number(windDirDeg),
      distance_to_village_m: Number(distanceToVillageM),
      burn_minutes: Number(burnMinutes)
    })
  })
}

/**
 * Record anonymous play session (/api/sessions)
 */
export async function recordPlaySession(sessionData) {
  try {
    return await apiFetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    })
  } catch {
    // Fail silently so gameplay is never interrupted
    return { status: 'offline_buffered' }
  }
}

/**
 * Get aggregated gameplay statistics (/api/stats)
 */
export async function getStatsApi() {
  return await apiFetch('/api/stats')
}
