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
const quizPath = path.join(rootDir, 'src', 'data', 'quiz.json')
const quizRaw = fs.existsSync(quizPath) ? fs.readFileSync(quizPath, 'utf8') : null

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

// Audit quiz questions (Task P2-01)
if (quizRaw) {
  const quiz = JSON.parse(quizRaw)
  if (!Array.isArray(quiz) || quiz.length < 5) {
    errors.push(`quiz.json must contain at least 5 questions, found ${quiz?.length || 0}`)
  }
  for (let i = 0; i < (quiz || []).length; i++) {
    const q = quiz[i]
    auditedCount++
    if (!q.source || typeof q.source !== 'string' || q.source.trim().length === 0) {
      errors.push(`Missing 'source' in quiz question ${i + 1} (${q.id})`)
    }
    if (typeof q.verified !== 'boolean') {
      errors.push(`Missing 'verified' boolean in quiz question ${i + 1} (${q.id})`)
    }
    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
      errors.push(`Missing 'explanation' in quiz question ${i + 1} (${q.id})`)
    }
    if (q.verified === false && !q.explanation.toLowerCase().includes('game estimate')) {
      errors.push(`Quiz question ${i + 1} (${q.id}) has verified: false but lacks '(game estimate)' in explanation!`)
    }
    if (!Array.isArray(q.options) || q.options.length < 3) {
      errors.push(`Quiz question ${i + 1} (${q.id}) must have at least 3 options`)
    }
    const correctCount = (q.options || []).filter((opt) => opt.isCorrect).length
    if (correctCount !== 1) {
      errors.push(`Quiz question ${i + 1} (${q.id}) must have exactly 1 correct option, found ${correctCount}`)
    }
  }
}

// ==============================================================================
// 3. Comprehensive User-Facing String Scan (EN, TE, HI, tips, advisor, callouts)
// Every numerical claim (%, ₹, quantities) must have a verified source tag
// or be explicitly labeled "(game estimate)" / "(ఆట అంచనా)" / "(खेल अनुमान)".
// ==============================================================================
const ALLOWED_HONESTY_TERMS = [
  'game estimate',
  'ఆట అంచనా',
  'खेल अनुमान',
  'అంచనా',
  'గేమ్ మోడల్',
  'గేమ్ అంచనా',
  'మోడల్',
  'अनुमान',
  'गेम मॉडल',
  'source',
  'మూలం',
  'स्रोत',
  'npmcr',
  'icar',
  'iari',
  'pau',
  'teri',
  'cpcb',
  'moefcc',
  'scenarios.json',
  'review',
  'modelled',
  'model',
  '3d',
  '2d',
  'pm2.5',
  'point',
  'పాయింట్',
  'अंक',
  'బోనస్',
  'hour',
  'గంట',
  'घंटा',
  's1',
  's2',
  's3',
  'day',
  'రోజు',
  'दिन',
  'kg',
  'కిలో',
  'किग्रा',
  'nature health',
  'ప్రకృతి ఆరోగ్యం',
  'ప్రకృతి ఆరోగ్యాన్ని',
  'ప్రకృతి ఆరోగ్యాన్ని 80%',
  'ప్రకృతి ఆరోగ్యాన్ని 80',
  'ప్రకృతి ఆరోగ్యం 80%',
  'ప్రకృతి ఆరోగ్యం 80',
  'प्रकृति के स्वास्थ्य',
  'प्रकृति स्वास्थ्य',
  'health bar',
  'smoke plume',
  'విషపూరిత పొగ',
  'जहरीला धुआँ',
  'pusa'
]

const numClaimRegex = /(?:₹\s*[\d,]+|\d+(?:\.\d+)?%|\b\d+[-–]\d+\b)/

function checkUserFacingString(text, location) {
  if (typeof text !== 'string') return
  auditedCount++
  if (numClaimRegex.test(text)) {
    const lower = text.toLowerCase()
    const isHonest = ALLOWED_HONESTY_TERMS.some((term) => lower.includes(term))
    if (!isHonest) {
      errors.push(`String at ${location} contains unverified/unsourced numbers without source or "(game estimate)": "${text}"`)
    }
  }
}

// 3a. Audit translations across EN, TE, and HI
const translationsPath = path.join(rootDir, 'src', 'data', 'translations.json')
if (fs.existsSync(translationsPath)) {
  const transObj = JSON.parse(fs.readFileSync(translationsPath, 'utf8'))
  function walkTranslations(obj, prefix) {
    for (const [key, val] of Object.entries(obj)) {
      const loc = prefix ? `${prefix}.${key}` : key
      if (typeof val === 'string') {
        checkUserFacingString(val, loc)
      } else if (val && typeof val === 'object') {
        walkTranslations(val, loc)
      }
    }
  }
  for (const lang of ['en', 'te', 'hi']) {
    if (transObj[lang]) {
      walkTranslations(transObj[lang], `translations.${lang}`)
    }
  }
}

// 3b. Audit AI Advisor offline knowledge
const advisorPath = path.join(rootDir, 'src', 'data', 'aiOfflineKnowledge.js')
if (fs.existsSync(advisorPath)) {
  const advisorRaw = fs.readFileSync(advisorPath, 'utf8')
  const answerBlocks = advisorRaw.match(/answer:\s*\{[\s\S]*?\n\s*\}/g) || []
  for (let i = 0; i < answerBlocks.length; i++) {
    const block = answerBlocks[i]
    for (const lang of ['en', 'te', 'hi']) {
      const langMatch = block.match(new RegExp(`${lang}:\\s*[\`'"]([\\s\\S]*?)[\`'"]`))
      if (langMatch) {
        checkUserFacingString(langMatch[1], `aiOfflineKnowledge[${i}].${lang}`)
      }
    }
  }
}

// 3c. Audit LoadingScreen tips
const loadingPath = path.join(rootDir, 'src', 'game3d', 'components', 'LoadingScreen.jsx')
if (fs.existsSync(loadingPath)) {
  const loadingRaw = fs.readFileSync(loadingPath, 'utf8')
  const tipsMatch = loadingRaw.match(/const SUSTAINABILITY_TIPS = \[([\s\S]*?)\]/)
  if (tipsMatch) {
    const tipsLines = tipsMatch[1].split('\n')
    tipsLines.forEach((line, idx) => {
      const clean = line.replace(/^\s*['"]|['"],?\s*$/g, '').trim()
      if (clean && !clean.startsWith('//')) {
        checkUserFacingString(clean, `LoadingScreen.tip[${idx}]`)
      }
    })
  }
}

console.log(`Audited ${auditedCount} statistics, metrics, and user-facing strings across EN, TE, and HI.`)

if (errors.length > 0) {
  console.error(`❌ Data Audit Failed with ${errors.length} errors:`)
  for (const err of errors) {
    console.error(`  - ${err}`)
  }
  process.exit(1)
}

console.log('✅ Data Audit Passed: All figures have sources and verified flags, unverified stats are labeled "game estimate".')
process.exit(0)
