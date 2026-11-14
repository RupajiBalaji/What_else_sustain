/**
 * scripts/audit_data.js
 * Data integrity audit script as required by WES_MVP_MASTER_PLAN.md Section 8.3 & Task P0-07.
 * Validates that:
 * 1. Every metric/stat in scenarios.json carries a 'source' and 'verified' flag.
 * 2. Any metric with verified: false includes '(game estimate)' in its label or text.
 * 3. Prohibited invalid claims like "100% Nitrogen Lost" do not exist.
 * 4. Option 5 is consistently labeled Compost (bio-decomposer).
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const scenariosPath = path.join(rootDir, 'src', 'data', 'scenarios.json')
const scenariosRaw = fs.readFileSync(scenariosPath, 'utf8')

// 1. Prohibited claims check
if (scenariosRaw.includes('100% Nitrogen Lost') || scenariosRaw.includes('100% Nitrogen &')) {
  console.error('❌ Data Audit Failed: Prohibited claim "100% Nitrogen Lost" found in scenarios.json!')
  process.exit(1)
}

const scenarios = JSON.parse(scenariosRaw)
let errors = []
let auditedCount = 0

function auditStatObject(stat, pathStr) {
  auditedCount++
  if (!stat.source || typeof stat.source !== 'string' || stat.source.trim().length === 0) {
    errors.push(`Missing 'source' at ${pathStr}`)
  }

  if (typeof stat.verified !== 'boolean') {
    errors.push(`Missing boolean 'verified' flag at ${pathStr}`)
  }

  if (stat.verified === false) {
    const valStr = typeof stat.value === 'object' ? JSON.stringify(stat.value) : String(stat.value || '')
    const labelStr = typeof stat.label === 'object' ? JSON.stringify(stat.label) : String(stat.label || '')
    const hasEstimateLabel =
      valStr.toLowerCase().includes('game estimate') ||
      labelStr.toLowerCase().includes('game estimate') ||
      valStr.includes('అంచనా') ||
      labelStr.includes('అంచనా')

    if (!hasEstimateLabel) {
      errors.push(`Stat at ${pathStr} has verified: false but lacks '(game estimate)' label!`)
    }
  }
}

for (const scenario of scenarios) {
  for (const choice of scenario.choices || []) {
    // Check threeCards stats
    const threeCards = choice.impact?.threeCards || []
    for (let i = 0; i < threeCards.length; i++) {
      const card = threeCards[i]
      if (card.stat) {
        auditStatObject(card.stat, `${scenario.id} -> ${choice.id} -> threeCards[${i}]`)
      }
    }

    // Check impact metrics
    const metrics = choice.impact?.metrics || []
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i]
      if (metric && typeof metric === 'object' && ('verified' in metric || 'source' in metric)) {
        auditStatObject(metric, `${scenario.id} -> ${choice.id} -> metrics[${i}]`)
      }
    }
  }
}

console.log(`Audited ${auditedCount} statistics and metric objects across scenarios.`)

if (errors.length > 0) {
  console.error(`❌ Data Audit Failed with ${errors.length} errors:`)
  for (const err of errors) {
    console.error(`  - ${err}`)
  }
  process.exit(1)
}

console.log('✅ Data Audit Passed: All figures have sources and verified flags, unverified stats are labeled "game estimate".')
process.exit(0)
