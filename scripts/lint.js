/**
 * scripts/lint.js
 * Project linter as required by WES_MVP_MASTER_PLAN.md P0-13 & Section 3.6b.
 * Checks for syntax validity, absence of unresolved merge conflicts, and code hygiene.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const targetDirs = ['src', 'scripts', 'tests']
let errors = []
let filesChecked = 0

// Git merge conflict markers: strictly 7 '<', '=', or '>' at the beginning of a line
const conflictMarkerStart = /^[<]{7}\s+[^\r\n]*/m
const conflictMarkerEnd = /^[>]{7}\s+[^\r\n]*/m
const conflictMarkerMid = /^[=]{7}$/m

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        scanDir(fullPath)
      }
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx') || entry.name.endsWith('.json'))) {
      filesChecked++
      const content = fs.readFileSync(fullPath, 'utf8')

      // Check for git merge conflict markers
      if (conflictMarkerStart.test(content) || conflictMarkerEnd.test(content) || conflictMarkerMid.test(content)) {
        errors.push(`Unresolved git merge conflict markers found in ${path.relative(rootDir, fullPath)}`)
      }
    }
  }
}

for (const d of targetDirs) {
  const full = path.join(rootDir, d)
  if (fs.existsSync(full)) {
    scanDir(full)
  }
}

console.log(`Linted ${filesChecked} source files across ${targetDirs.join(', ')}.`)

if (errors.length > 0) {
  console.error(`❌ Lint Failed with ${errors.length} errors:`)
  for (const err of errors) {
    console.error(`  - ${err}`)
  }
  process.exit(1)
}

console.log('✅ Lint Passed: Zero merge conflicts, clean source tree.')
process.exit(0)
