/**
 * src/game3d/state/seasonMachine.js
 * Explicit Season State Machine as defined in WES_MVP_MASTER_PLAN.md Section 5.1 & Task P1-01.
 *
 * States:
 * LOADING -> MODE_SELECT -> (YOUR_FARM) -> PRECHECK_QUIZ -> SOWING -> GROWING -> HARVEST -> DECISION -> CONSEQUENCE -> REPORT -> POSTCHECK_QUIZ -> NEXT_SEASON
 */

export const SEASON_STATES = {
  LOADING: 'LOADING',
  MODE_SELECT: 'MODE_SELECT',
  YOUR_FARM: 'YOUR_FARM',
  PRECHECK_QUIZ: 'PRECHECK_QUIZ',
  SOWING: 'sowing',
  GROWING: 'growing',
  HARVEST: 'harvested',
  DECISION: 'decision',
  CONSEQUENCE: 'consequence',
  REPORT: 'report',
  POSTCHECK_QUIZ: 'POSTCHECK_QUIZ',
  COMPARISON: 'comparison',
  REWIND: 'rewind'
}

// Allowed state transitions graph
const ALLOWED_TRANSITIONS = {
  [SEASON_STATES.LOADING]: [SEASON_STATES.MODE_SELECT],
  [SEASON_STATES.MODE_SELECT]: [
    SEASON_STATES.YOUR_FARM,
    SEASON_STATES.PRECHECK_QUIZ,
    SEASON_STATES.DECISION, // Quick play jump
    SEASON_STATES.SOWING
  ],
  [SEASON_STATES.YOUR_FARM]: [
    SEASON_STATES.PRECHECK_QUIZ,
    SEASON_STATES.DECISION, // Quick play
    SEASON_STATES.SOWING
  ],
  [SEASON_STATES.PRECHECK_QUIZ]: [
    SEASON_STATES.DECISION, // Quick play
    SEASON_STATES.SOWING
  ],
  [SEASON_STATES.SOWING]: [SEASON_STATES.GROWING],
  [SEASON_STATES.GROWING]: [SEASON_STATES.HARVEST, 'harvest'],
  [SEASON_STATES.HARVEST]: [SEASON_STATES.DECISION],
  harvest: [SEASON_STATES.DECISION],
  [SEASON_STATES.DECISION]: [SEASON_STATES.CONSEQUENCE],
  [SEASON_STATES.CONSEQUENCE]: [
    SEASON_STATES.REPORT,
    'season_report',
    SEASON_STATES.REWIND,
    SEASON_STATES.DECISION // After rewind
  ],
  [SEASON_STATES.REWIND]: [SEASON_STATES.DECISION],
  [SEASON_STATES.REPORT]: [
    SEASON_STATES.POSTCHECK_QUIZ,
    SEASON_STATES.COMPARISON,
    SEASON_STATES.SOWING, // Next season
    SEASON_STATES.DECISION // Quick play next season
  ],
  season_report: [
    SEASON_STATES.POSTCHECK_QUIZ,
    SEASON_STATES.COMPARISON,
    SEASON_STATES.SOWING,
    SEASON_STATES.DECISION
  ],
  [SEASON_STATES.POSTCHECK_QUIZ]: [
    SEASON_STATES.COMPARISON,
    SEASON_STATES.SOWING,
    SEASON_STATES.DECISION
  ],
  [SEASON_STATES.COMPARISON]: [
    SEASON_STATES.DECISION, // Try another alternative
    SEASON_STATES.SOWING // Keep choice and advance
  ]
}

export class SeasonMachine {
  constructor(initialState = SEASON_STATES.LOADING, mode = 'full') {
    this.currentState = initialState
    this.mode = mode // 'quick' | 'full'
    this.history = [{ state: initialState, ts: Date.now() }]
    this.triedChoices = []
  }

  getState() {
    return this.currentState
  }

  canTransitionTo(targetState) {
    const allowed = ALLOWED_TRANSITIONS[this.currentState] || []
    return allowed.includes(targetState)
  }

  transition(targetState, payload = {}) {
    if (!this.canTransitionTo(targetState)) {
      throw new Error(`Invalid transition: Cannot transition from ${this.currentState} to ${targetState}`)
    }

    if (payload.choiceId && !this.triedChoices.includes(payload.choiceId)) {
      this.triedChoices.push(payload.choiceId)
    }

    this.currentState = targetState
    this.history.push({ state: targetState, ts: Date.now(), payload })
    return this.currentState
  }

  rewind() {
    if (this.currentState !== SEASON_STATES.CONSEQUENCE && this.currentState !== SEASON_STATES.REPORT) {
      throw new Error(`Invalid rewind: Cannot rewind from ${this.currentState}`)
    }
    this.currentState = SEASON_STATES.DECISION
    this.history.push({ state: SEASON_STATES.DECISION, ts: Date.now(), isRewind: true })
    return this.currentState
  }

  getHistory() {
    return [...this.history]
  }

  getTriedChoices() {
    return [...this.triedChoices]
  }
}

export function createSeasonMachine(initialState = SEASON_STATES.LOADING, mode = 'full') {
  return new SeasonMachine(initialState, mode)
}
