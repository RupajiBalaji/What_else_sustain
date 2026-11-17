import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../src')

const commonHooks = [
  'useState',
  'useEffect',
  'useRef',
  'useCallback',
  'useMemo',
  'useContext',
  'useReducer',
  'useId',
  'useLayoutEffect',
  'useImperativeHandle'
]

let totalChecked = 0
let errors = []

function scanFile(filePath) {
  totalChecked++
  const code = fs.readFileSync(filePath, 'utf8')
  
  // Strip comments and strings to avoid false positives
  const strippedCode = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .replace(/(["'`])(?:\\.|(?!\1)[^\\\r\n])*\1/g, '""')

  for (const hook of commonHooks) {
    // Check if the hook is invoked, e.g. useEffect( or useEffect<
    const hookCallRegex = new RegExp(`\\b${hook}\\s*\\(`, 'g')
    if (hookCallRegex.test(strippedCode)) {
      // Check if it's imported or defined
      // e.g. import ... hook ... from ...
      // or const hook = ...
      // or function hook ...
      const importedRegex = new RegExp(`import\\s+{[^}]*\\b${hook}\\b[^}]*}\\s+from`, 'm')
      const reactDotRegex = new RegExp(`React\\.${hook}\\s*\\(`, 'g')
      const definedRegex = new RegExp(`(?:const|let|var|function)\\s+\\b${hook}\\b`, 'm')
      
      const isImported = importedRegex.test(code)
      const isDefined = definedRegex.test(code)
      
      // If code only calls hook( directly, without importing or defining, it's a bug!
      if (!isImported && !isDefined) {
        // Also check if it's exclusively used as React.hook(
        const allCalls = code.match(new RegExp(`\\b${hook}\\s*\\(`, 'g')) || []
        const reactCalls = code.match(new RegExp(`React\\.${hook}\\s*\\(`, 'g')) || []
        if (allCalls.length > reactCalls.length) {
          errors.push({
            file: path.relative(path.resolve(__dirname, '..'), filePath),
            hook,
            bareCalls: allCalls.length - reactCalls.length
          })
        }
      }
    }
  }
}

function traverse(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      traverse(full)
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      scanFile(full)
    }
  }
}

traverse(srcDir)

console.log(`Scanned ${totalChecked} files in src/ for hook imports.`)
if (errors.length > 0) {
  console.error(`❌ Found ${errors.length} unimported hook usages:`)
  for (const err of errors) {
    console.error(`  - ${err.file}: calls ${err.hook} without importing it (${err.bareCalls} occurrences)`)
  }
  process.exit(1)
} else {
  console.log(`✅ All React hooks are properly imported or qualified across all ${totalChecked} files.`)
  process.exit(0)
}
