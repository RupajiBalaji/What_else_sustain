/**
 * soundManager.js
 * Howler.js based ambient & sound effects manager with Web Audio synthesis fallback.
 * Strictly adheres to:
 * - No autoplay before first user interaction
 * - Global mute toggle persisted in memory / storage
 * - Synthesized procedural audio (ambient drone, fire crackle, rewind whoosh, success chime)
 *   so it works immediately without external MP3 asset dependency.
 */

import { Howl, Howler } from 'howler'

class SoundManager {
  constructor() {
    this.isMuted = false
    this.hasInteracted = false
    this.audioCtx = null
    this.ambientOsc = null
    this.ambientGain = null
    this.fireTimer = null
  }

  initAudio() {
    if (this.hasInteracted) return
    this.hasInteracted = true

    // Resume AudioContext if suspended
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass && !this.audioCtx) {
      try {
        this.audioCtx = new AudioContextClass()
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume()
        }
      } catch (e) {
        console.warn('[SoundManager] AudioContext init error:', e)
      }
    }
  }

  setMuted(muted) {
    this.isMuted = muted
    Howler.mute(muted)
    if (muted) {
      this.stopAmbient()
      this.stopFireCrackle()
      this.stopTractorEngine()
      this.stopBalerSound()
    } else if (this.hasInteracted) {
      this.playAmbient()
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted)
    return this.isMuted
  }

  // 1. Ambient Village (warm rural birds, wind drone)
  playAmbient() {
    if (this.isMuted || !this.hasInteracted) return
    this.stopAmbient()

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        this.audioCtx = new AudioContextClass()
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume()
      }

      // Warm low drone simulating peaceful open village morning/evening
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(146.83, this.audioCtx.currentTime) // D3 warm tone
      
      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.04, this.audioCtx.currentTime + 3)

      osc.connect(gain)
      gain.connect(this.audioCtx.destination)
      osc.start()

      this.ambientOsc = osc
      this.ambientGain = gain
    } catch (e) {
      console.warn('[SoundManager] Ambient error:', e)
    }
  }

  stopAmbient() {
    try {
      if (this.ambientOsc) {
        this.ambientGain?.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1)
        setTimeout(() => {
          this.ambientOsc?.stop()
          this.ambientOsc?.disconnect()
          this.ambientOsc = null
        }, 1100)
      }
    } catch {
      this.ambientOsc = null
    }
  }

  // 2. Fire Crackle (stochastic bursts for hold-to-light)
  startFireCrackle() {
    if (this.isMuted || !this.hasInteracted) return
    this.stopFireCrackle()

    const makePop = () => {
      if (this.isMuted || !this.audioCtx) return
      try {
        const bufferSize = this.audioCtx.sampleRate * 0.05
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate)
        const output = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1
        }

        const whiteNoise = this.audioCtx.createBufferSource()
        whiteNoise.buffer = buffer

        const filter = this.audioCtx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 800 + Math.random() * 1200
        filter.Q.value = 3

        const gain = this.audioCtx.createGain()
        gain.gain.setValueAtTime(0.08 + Math.random() * 0.08, this.audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04)

        whiteNoise.connect(filter)
        filter.connect(gain)
        gain.connect(this.audioCtx.destination)

        whiteNoise.start()
      } catch (e) {
        // Safe catch
      }

      const nextDelay = 40 + Math.random() * 90
      this.fireTimer = setTimeout(makePop, nextDelay)
    }

    makePop()
  }

  stopFireCrackle() {
    if (this.fireTimer) {
      clearTimeout(this.fireTimer)
      this.fireTimer = null
    }
  }

  // 3. Rewind Whoosh (reverse VHS tone sweeping from low to high then dropping)
  playRewindWhoosh() {
    if (this.isMuted || !this.hasInteracted) return
    try {
      if (!this.audioCtx) return
      const now = this.audioCtx.currentTime

      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(110, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.5)
      osc.frequency.exponentialRampToValueAtTime(220, now + 1.1)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.4)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

      // Add a tape-stop lowpass filter
      const filter = this.audioCtx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2500, now)
      filter.frequency.linearRampToValueAtTime(400, now + 1.2)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.audioCtx.destination)

      osc.start(now)
      osc.stop(now + 1.25)
    } catch (e) {
      console.warn('[SoundManager] Rewind sound error:', e)
    }
  }

  // 4. Success Chime (crystal pentatonic bell arpeggio)
  playSuccessChime() {
    if (this.isMuted || !this.hasInteracted) return
    try {
      if (!this.audioCtx) return
      const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      const now = this.audioCtx.currentTime

      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.12)

        const start = now + idx * 0.12
        gain.gain.setValueAtTime(0.001, start)
        gain.gain.exponentialRampToValueAtTime(0.15, start + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.8)

        osc.connect(gain)
        gain.connect(this.audioCtx.destination)

        osc.start(start)
        osc.stop(start + 0.85)
      })
    } catch (e) {
      console.warn('[SoundManager] Chime error:', e)
    }
  }

  // Short tap sound
  playTap() {
    if (this.isMuted || !this.hasInteracted || !this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.06)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

      osc.connect(gain)
      gain.connect(this.audioCtx.destination)

      osc.start(now)
      osc.stop(now + 0.07)
    } catch {
      // Ignore
    }
  }

  // 5. Error / Mistake Buzz (friendly low bonk/buzz for kids game)
  playError() {
    if (this.isMuted || !this.hasInteracted || !this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(160, now)
      osc.frequency.linearRampToValueAtTime(110, now + 0.25)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

      osc.connect(gain)
      gain.connect(this.audioCtx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    } catch (e) {
      console.warn('[SoundManager] Error sound error:', e)
    }
  }

  // 6. Win Fanfare (triumphant bright chord)
  playWin() {
    if (this.isMuted || !this.hasInteracted || !this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      const notes = [
        { f: 523.25, t: 0.00 }, // C5
        { f: 659.25, t: 0.12 }, // E5
        { f: 783.99, t: 0.24 }, // G5
        { f: 1046.50, t: 0.36 } // C6
      ]

      notes.forEach(({ f, t }) => {
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(f, now + t)

        const start = now + t
        gain.gain.setValueAtTime(0.001, start)
        gain.gain.exponentialRampToValueAtTime(0.2, start + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7)

        osc.connect(gain)
        gain.connect(this.audioCtx.destination)

        osc.start(start)
        osc.stop(start + 0.75)
      })
    } catch (e) {
      console.warn('[SoundManager] Win fanfare error:', e)
    }
  }

  // 7. Pop sound (for sorting items or bubble taps)
  playPop() {
    if (this.isMuted || !this.hasInteracted || !this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(900, now)
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.07)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)

      osc.connect(gain)
      gain.connect(this.audioCtx.destination)

      osc.start(now)
      osc.stop(now + 0.08)
    } catch {
      // Ignore
    }
  }

  // 8. Coin / Star chime
  playCoin() {
    if (this.isMuted || !this.hasInteracted || !this.audioCtx) return
    try {
      const now = this.audioCtx.currentTime
      const tones = [987.77, 1318.51] // B5 -> E6
      tones.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()

        osc.type = 'sine'
        const start = now + idx * 0.09
        osc.frequency.setValueAtTime(freq, start)

        gain.gain.setValueAtTime(0.001, start)
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)

        osc.connect(gain)
        gain.connect(this.audioCtx.destination)

        osc.start(start)
        osc.stop(start + 0.38)
      })
    } catch {
      // Ignore
    }
  }

  // 9. Tractor Engine (rhythmic low diesel idle and driving rumble)
  startTractorEngine() {
    if (this.isMuted || !this.hasInteracted) return
    this.stopTractorEngine()
    try {
      if (!this.audioCtx) return
      const now = this.audioCtx.currentTime

      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      const filter = this.audioCtx.createBiquadFilter()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(54, now) // Low diesel fundamental

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(260, now)

      // LFO for periodic engine chug
      const lfo = this.audioCtx.createOscillator()
      const lfoGain = this.audioCtx.createGain()
      lfo.frequency.setValueAtTime(9.5, now) // 9.5 Hz chug rhythm
      lfoGain.gain.setValueAtTime(0.04, now)

      gain.gain.setValueAtTime(0.06, now)

      lfo.connect(gain.gain)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.audioCtx.destination)

      osc.start(now)
      lfo.start(now)

      this.tractorOsc = osc
      this.tractorLfo = lfo
      this.tractorGain = gain
    } catch (e) {
      console.warn('[SoundManager] Tractor engine audio error:', e)
    }
  }

  stopTractorEngine() {
    try {
      if (this.tractorGain && this.audioCtx) {
        this.tractorGain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3)
        setTimeout(() => {
          this.tractorOsc?.stop()
          this.tractorLfo?.stop()
          this.tractorOsc?.disconnect()
          this.tractorLfo?.disconnect()
          this.tractorOsc = null
          this.tractorLfo = null
          this.tractorGain = null
        }, 350)
      }
    } catch {
      this.tractorOsc = null
      this.tractorLfo = null
      this.tractorGain = null
    }
  }

  // 10. Baler Mechanical Action (rhythmic clatter & compress whoosh)
  startBalerSound() {
    if (this.isMuted || !this.hasInteracted) return
    this.stopBalerSound()

    const makeCycle = () => {
      if (this.isMuted || !this.audioCtx) return
      try {
        const now = this.audioCtx.currentTime
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(180, now)
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.12)

        gain.gain.setValueAtTime(0.09, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)

        osc.connect(gain)
        gain.connect(this.audioCtx.destination)
        osc.start(now)
        osc.stop(now + 0.15)
      } catch {
        // Safe catch
      }

      this.balerTimer = setTimeout(makeCycle, 480)
    }

    makeCycle()
  }

  stopBalerSound() {
    if (this.balerTimer) {
      clearTimeout(this.balerTimer)
      this.balerTimer = null
    }
  }
}

export const sound = new SoundManager()

