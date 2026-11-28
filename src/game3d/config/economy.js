import scenariosData from '../../data/scenarios.json' with { type: 'json' }
import { GAME_BALANCE } from './gameBalance.js'

const farmScenario = scenariosData.find((s) => s.id === 'farm_crop_residue') || scenariosData[0]

/**
 * Build a map of choiceKey -> economics from scenarios.json (single source of truth).
 */
export function getChoiceEconomicsMap() {
  const map = {}
  for (const choice of farmScenario?.choices || []) {
    if (choice.gameKey && choice.economics) {
      map[choice.gameKey] = choice.economics
    }
  }
  const extra = farmScenario?.extraChoiceEconomics || {}
  for (const [k, v] of Object.entries(extra)) {
    map[k] = v
  }
  return map
}

export const CHOICE_ECONOMICS = getChoiceEconomicsMap()

/**
 * Diminishing returns curve near 100 so stats cannot cap in 2-3 seasons.
 * Negative deltas apply in full; positive deltas taper as current -> 100.
 */
export function applyDiminishingDelta(currentValue, rawDelta) {
  if (rawDelta <= 0) {
    return Math.max(0, Math.min(100, currentValue + rawDelta))
  }
  if (currentValue >= 100) return 100
  const headroom = Math.max(0, 100 - currentValue) / 100
  const effective = Math.max(1, Math.round(rawDelta * Math.pow(headroom, 1.45) * 1.15))
  return Math.min(100, currentValue + effective)
}

/**
 * Season-scaled input cost multiplier (mild inflation / wear across seasons).
 */
export function getSeasonCostScale(seasonIndex = 1) {
  return 1 + Math.max(0, seasonIndex - 1) * 0.05
}

/**
 * Deterministic occasional setback (weather / market price dip / repair) so late-game
 * money does not snowball unchecked.
 */
export function getSeasonSetback(seasonIndex = 1, acres = 5) {
  if (seasonIndex <= 1) return null
  const scale = Math.max(0.4, acres / 5)
  if (seasonIndex % 4 === 0) {
    return {
      id: 'equipment_repair',
      label: 'Seasonal tractor & pump maintenance',
      amount: -Math.round(3200 * scale),
      tag: 'Game estimate'
    }
  }
  if (seasonIndex % 3 === 0) {
    return {
      id: 'market_dip',
      label: 'Late-monsoon grain moisture price deduction',
      amount: -Math.round(2400 * scale),
      tag: 'Game estimate'
    }
  }
  return null
}

/**
 * Visible goal for each season.
 */
export function getSeasonGoal(seasonIndex = 1) {
  if (seasonIndex === 1) {
    return 'Goal S1: Avoid open burning and keep Village Air >= 75%.'
  }
  if (seasonIndex <= 3) {
    return `Goal S${seasonIndex}: Reach Soil Health 80% while keeping ₹15,000+ reserve.`
  }
  if (seasonIndex <= 7) {
    return `Goal S${seasonIndex}: Maintain clean-air streak & build Soil Health toward 90%.`
  }
  return `Goal S${seasonIndex}: Sustain 90%+ Soil & Village Health through market/weather shifts.`
}

/**
 * Compute upfront cost (deducted at decision) and end-of-season cash delta for a choice,
 * derived strictly from scenarios.json economics * acres * seasonScale.
 */
export function computeChoiceFinancials(choiceKey, { acres = 5, seasonIndex = 1 } = {}) {
  const econ = CHOICE_ECONOMICS[choiceKey] || CHOICE_ECONOMICS.burn
  const safeAcres = Math.max(1, Math.min(20, Number(acres) || 5))
  const scale = getSeasonCostScale(seasonIndex)

  const upfrontCost = Math.round((econ.upfrontCostPerAcre || 0) * safeAcres * scale)
  const endPenalty = Math.round((econ.endPenaltyPerAcre || 0) * safeAcres * scale)

  // For bale_sell, net return varies by season (transport/moisture) within the sourced Punjab range
  let endReturn = Math.round((econ.endReturnPerAcre || 0) * safeAcres)
  if (choiceKey === 'bale_sell' && Array.isArray(econ.netRangePerAcre)) {
    const [minNet, maxNet] = econ.netRangePerAcre
    // Season 1 uses +500/acre (+2,500 for 5 acres); later seasons fluctuate within [minNet, maxNet]
    const perAcre = seasonIndex === 1
      ? econ.endReturnPerAcre
      : seasonIndex % 3 === 0
        ? minNet
        : Math.min(maxNet, Math.max(minNet, econ.endReturnPerAcre - (seasonIndex % 2) * 200))
    endReturn = Math.round(perAcre * safeAcres)
  }

  // decisionRevenue is the total net effect of the residue choice itself (matches HUD & Report)
  const decisionRevenue = endReturn - upfrontCost - endPenalty

  return {
    upfrontCost,
    endPenalty,
    endReturn,
    decisionRevenue,
    acres: safeAcres,
    econ
  }
}

/**
 * Compute full end-of-season financial & carry-over outcome.
 * Ensures upfrontCost + harvestAddition == netSeasonBalance to the exact rupee.
 */
export function computeSeasonOutcome(choiceKey, state, { acres = 5, isPerfectSow = false } = {}) {
  const decisionConfig = GAME_BALANCE.DECISIONS[choiceKey] || GAME_BALANCE.DECISIONS.burn
  const seasonIndex = state?.seasonIndex || 1
  const soilHealth = state?.soilHealth ?? 70
  const villageHealth = state?.villageHealth ?? 75
  const reputation = state?.reputation ?? 50
  const startMoney = state?.money ?? GAME_BALANCE.INITIAL_STATE.money

  const fin = computeChoiceFinancials(choiceKey, { acres, seasonIndex })

  // Crop revenue scaled by soil health, acreage, and sowing bonus
  const acreScale = fin.acres / 5
  const baseRevenue = 19500 * acreScale
  const minRevenue = 8500 * acreScale
  const healthMult = Math.max(0.45, soilHealth / 100)
  const sowBonus = isPerfectSow ? 1.08 : 1.0
  const yieldMod = choiceKey === 'burn' ? 0.85 : 1 + (decisionConfig.revenueYieldBonus || 0) * 0.5
  const cropRevenue = Math.max(
    Math.round(minRevenue),
    Math.round(baseRevenue * healthMult * sowBonus * yieldMod)
  )

  // Recurring farm operating cost (seeds, irrigation, labor) scaled by season & acres
  const operatingCost = Math.round((8500 + (seasonIndex - 1) * 300) * acreScale)
  const setback = getSeasonSetback(seasonIndex, fin.acres)
  const setbackAmount = setback ? setback.amount : 0

  // Net season balance = cropRevenue - operatingCost + decisionRevenue + setbackAmount
  const netSeasonBalance = cropRevenue - operatingCost + fin.decisionRevenue + setbackAmount

  // At finishSeason, upfrontCost was already deducted in startAlternative (or 0 for burn/bale)
  const harvestAddition = netSeasonBalance + fin.upfrontCost
  const nextMoney = Math.max(0, startMoney - fin.upfrontCost + harvestAddition)

  const nextSoil = applyDiminishingDelta(soilHealth, decisionConfig.soilHealthDelta)
  const nextVillage = applyDiminishingDelta(villageHealth, decisionConfig.villageHealthDelta)
  const nextRep = applyDiminishingDelta(reputation, decisionConfig.reputationDelta)

  return {
    fin,
    cropRevenue,
    operatingCost,
    setback,
    decisionRevenue: fin.decisionRevenue,
    netSeasonBalance,
    harvestAddition,
    nextMoney,
    nextSoil,
    nextVillage,
    nextRep,
    soilDelta: nextSoil - soilHealth,
    villageDelta: nextVillage - villageHealth,
    repDelta: nextRep - reputation,
    xpGained: decisionConfig.xpAward,
    nextStreak: decisionConfig.streakReset ? 0 : (state?.streak || 0) + 1
  }
}
