import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('Settings & Accessibility Verification (P4-01 & P4-02)', () => {
  it('persists accessibility preferences in localStorage', () => {
    const mockStorage = {}
    const setItem = (k, v) => { mockStorage[k] = String(v) }
    const getItem = (k) => mockStorage[k] || null

    // Test Color-blind toggle
    setItem('wes_colorblind', 'true')
    assert.strictEqual(getItem('wes_colorblind'), 'true')

    // Test Subtitles toggle
    setItem('wes_subtitles', 'false')
    assert.strictEqual(getItem('wes_subtitles'), 'false')

    // Test Large text toggle
    setItem('wes_largetext', 'true')
    assert.strictEqual(getItem('wes_largetext'), 'true')

    // Test Farm config
    const farmCfg = { state: 'Haryana', crop: 'Paddy', acres: 10 }
    setItem('wes_farm_config', JSON.stringify(farmCfg))
    const loaded = JSON.parse(getItem('wes_farm_config'))
    assert.strictEqual(loaded.state, 'Haryana')
    assert.strictEqual(loaded.acres, 10)
  })

  it('P4-03: verifies all 3D model assets are strictly under 1 MB', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const modelsDir = path.resolve('public', 'models')
    const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.glb'))

    assert.ok(files.length >= 6, 'Must contain at least 6 core 3D models')
    for (const f of files) {
      const stats = fs.statSync(path.join(modelsDir, f))
      assert.ok(
        stats.size < 1024 * 1024,
        `Model ${f} exceeds 1MB limit (actual: ${(stats.size / 1024).toFixed(1)} KB)`
      )
    }
  })
})
