/**
 * scripts/simulate_balance.js
 * Plays 12 seasons across every single-option and mixed strategy using the real
 * economy model, writes docs/BALANCE_REPORT.md, and fails if any strategy
 * reaches the 100/100/100 caps before Season 8 or snowballs uncontrollably.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { GAME_BALANCE } from '../src/game3d/config/gameBalance.js'
import { computeSeasonOutcome, getSeasonGoal } from '../src/game3d/config/economy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const STRATEGIES = [
  { name: 'Always Burn', pick: () => 'burn' },
  { name: 'Always Happy Seeder', pick: () => 'happy_seeder' },
  { name: 'Always Bale & Sell', pick: () => 'bale_sell' },
  { name: 'Always Mulch', pick: () => 'mulch' },
  { name: 'Always Compost', pick: () => 'compost' },
  {
    name: 'Mixed Sustainable',
    pick: (s) => ['happy_seeder', 'bale_sell', 'mulch', 'compost'][(s - 1) % 4]
  }
]

const SEASONS = 12
let md = `# 12-Season Economy Balance Report\n\n`
md += `Generated automatically by \`scripts/simulate_balance.js\` from \`src/game3d/config/economy.js\` and \`src/data/scenarios.json\`.\n\n`
md += `## Strategy Summary (Season 1 to Season ${SEASONS})\n\n`
md += `| Strategy | S1 Money | S8 Money | S12 Money | S8 Soil/Village/Rep | S12 Soil/Village/Rep | First 100/100/100 Season |\n`
md += `|---|---:|---:|---:|---|---|---|\n`

const failures = []
const detailedSections = []

for (const strat of STRATEGIES) {
  let state = { ...GAME_BALANCE.INITIAL_STATE }
  let firstAll100Season = null
  const rows = []

  for (let s = 1; s <= SEASONS; s++) {
    state.seasonIndex = s
    const choiceKey = strat.pick(s)
    const out = computeSeasonOutcome(choiceKey, state, { acres: 5, isPerfectSow: false })
    state = {
      ...state,
      money: out.nextMoney,
      soilHealth: out.nextSoil,
      villageHealth: out.nextVillage,
      reputation: out.nextRep,
      streak: out.nextStreak,
      farmerXP: state.farmerXP + out.xpGained
    }

    if (
      firstAll100Season === null &&
      state.soilHealth >= 100 &&
      state.villageHealth >= 100 &&
      state.reputation >= 100
    ) {
      firstAll100Season = s
    }

    rows.push({
      s,
      choiceKey,
      net: out.netSeasonBalance,
      money: state.money,
      soil: state.soilHealth,
      village: state.villageHealth,
      rep: state.reputation,
      goal: getSeasonGoal(s),
      setback: out.setback ? out.setback.label : 'None'
    })
  }

  if (firstAll100Season !== null && firstAll100Season < 8) {
    failures.push(`${strat.name} reached 100/100/100 caps at Season ${firstAll100Season} (must be >= Season 8)`)
  }
  if (state.money > 150000) {
    failures.push(`${strat.name} snowballed money to ₹${state.money} by Season ${SEASONS} (limit ₹150,000)`)
  }

  const s1 = rows[0]
  const s8 = rows[7]
  const s12 = rows[11]
  md += `| ${strat.name} | ₹${s1.money.toLocaleString('en-IN')} | ₹${s8.money.toLocaleString('en-IN')} | ₹${s12.money.toLocaleString('en-IN')} | ${s8.soil}/${s8.village}/${s8.rep} | ${s12.soil}/${s12.village}/${s12.rep} | ${firstAll100Season ? `S${firstAll100Season}` : 'Not reached'} |\n`

  let sec = `### ${strat.name}\n\n`
  sec += `| Season | Choice | Net Delta | End Money | Soil / Village / Rep | Setback |\n`
  sec += `|---:|---|---:|---:|---|---|\n`
  for (const r of rows) {
    sec += `| ${r.s} | ${r.choiceKey} | ${r.net >= 0 ? '+' : ''}₹${r.net.toLocaleString('en-IN')} | ₹${r.money.toLocaleString('en-IN')} | ${r.soil} / ${r.village} / ${r.rep} | ${r.setback} |\n`
  }
  detailedSections.push(sec)
}

md += `\n## Season-by-Season Breakdown\n\n` + detailedSections.join('\n')

const outPath = path.join(rootDir, 'docs', 'BALANCE_REPORT.md')
fs.writeFileSync(outPath, md, 'utf8')
console.log(`Wrote ${outPath}`)

if (failures.length > 0) {
  console.error('❌ Balance simulation failed:')
  for (const f of failures) console.error(' -', f)
  process.exit(1)
}

console.log('✅ Balance simulation passed: no strategy reaches caps before Season 8 or snowballs.')
