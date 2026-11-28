/**
 * Pure decision-phase snapshot & rewind restoration helpers.
 * Prevents rewind/replay exploits where players accumulate money, soilHealth,
 * villageHealth, reputation, XP, or streak across aborted timelines.
 */

export const SNAPSHOT_FIELDS = [
  'money',
  'soilHealth',
  'villageHealth',
  'reputation',
  'farmerXP',
  'farmerLevel',
  'streak',
  'seasonIndex',
  'yearIndex',
  'totalBaleIncome',
  'happySeederUses',
  'compostUses',
  'mulchUses',
  'perfectSowingCount'
]

/**
 * Capture a deep-cloned snapshot of persistentState at the start of the decision phase.
 */
export function captureDecisionSnapshot(state) {
  if (!state || typeof state !== 'object') return null
  const snap = {}
  for (const key of SNAPSHOT_FIELDS) {
    if (key in state) {
      snap[key] = state[key]
    }
  }
  snap.history = Array.isArray(state.history) ? state.history.map((h) => ({ ...h })) : []
  snap.achievements = Array.isArray(state.achievements) ? [...state.achievements] : []
  return snap
}

/**
 * Restore persistentState back to the captured decision snapshot while preserving
 * session-level exploration tracking (triedChoices, one-time discovery bonuses, quiz flags).
 */
export function restoreDecisionSnapshot(currentState, snapshot) {
  if (!snapshot) return currentState
  const restored = {
    ...(currentState || {}),
    ...snapshot,
    history: Array.isArray(snapshot.history) ? snapshot.history.map((h) => ({ ...h })) : []
  }

  // Preserve one-time discovery bonuses & exploration flags across rewinds
  if (Array.isArray(currentState?.discoveryBonusesAwarded)) {
    restored.discoveryBonusesAwarded = [...currentState.discoveryBonusesAwarded]
  }
  if (Array.isArray(currentState?.achievements)) {
    restored.achievements = Array.from(
      new Set([...(snapshot.achievements || []), ...currentState.achievements])
    )
  }
  if (currentState?.preCheckCompleted !== undefined) {
    restored.preCheckCompleted = currentState.preCheckCompleted
  }
  if (currentState?.preCheckSkipped !== undefined) {
    restored.preCheckSkipped = currentState.preCheckSkipped
  }
  if (currentState?.postCheckCompleted !== undefined) {
    restored.postCheckCompleted = currentState.postCheckCompleted
  }
  if (currentState?.postCheckSkipped !== undefined) {
    restored.postCheckSkipped = currentState.postCheckSkipped
  }

  return restored
}

/**
 * Award a one-time discovery bonus for exploring an option in a session.
 * Returns { state, awarded } where awarded is true only the first time for choiceKey.
 */
export function recordOneTimeDiscovery(state, choiceKey) {
  if (!state || !choiceKey) return { state, awarded: false }
  const existing = Array.isArray(state.discoveryBonusesAwarded) ? state.discoveryBonusesAwarded : []
  if (existing.includes(choiceKey)) {
    return { state, awarded: false }
  }
  return {
    state: {
      ...state,
      discoveryBonusesAwarded: [...existing, choiceKey]
    },
    awarded: true
  }
}
