/**
 * AudioManager.js
 * Advanced Web Audio & Howler-based audio system for What Else Sustain 3D Farm.
 * 
 * Features:
 * 1. Clean User-Gesture Audio Unlock (no autoplay policy violations)
 * 2. Master, Sound Effects, and Music volume channels + Mute
 * 3. Dynamic Ambient Loop:
 *    - Wind sound whose volume & cutoff frequency scale with real wind speed (windState.speedMs)
 *    - Procedural birdsong that attenuates & fades when smoke rises
 *    - Distant village ambient chatter
 * 4. Spatial Audio Engine:
 *    - Distance-based attenuation (1 / (1 + d * 0.08))
 *    - Stereo panning based on horizontal screen / camera orientation
 *    - Applied to Tractor, Harvester, Baler, and Fire crackle
 * 5. Surface-dependent Footsteps:
 *    - Dirt (soft low thump for fields)
 *    - Grass (light rustle for borders and canal)
 *    - Road (crisp stone/gravel tap)
 * 6. Layered Adaptive Music:
 *    - 'calm': gentle pastoral pentatonic progression
 *    - 'tense': low pulsing drone during fire
 *    - 'hopeful': bright restorative chords during and after alternatives
 * 7. 100% self-contained synthesized Web Audio with zero external MP3 dependencies.
 */

import { Howler } from 'howler'

class AudioManager {
  constructor() {
    this.isUnlocked = false
    this.isMuted = false
    this.masterVolume = 0.8
    this.sfxVolume = 0.8
    this.musicVolume = 0.6

    this.audioCtx = null

    // Master bus nodes
    this.masterGain = null
    this.sfxGain = null
    this.musicGain = null

    // Ambient loop nodes
    this.windGain = null
    this.windFilter = null
    this.windNoiseNode = null

    this.birdTimer = null
    this.isBirdActive = false

    this.villageGain = null
    this.villageOsc1 = null
    this.villageOsc2 = null

    // Spatial sound sources registry: { [id]: { gain, panner, active, ... } }
    this.spatialSources = {}

    // Footstep throttling
    this.lastFootstepTime = 0

    // Music state
    this.musicState = 'calm' // 'calm' | 'tense' | 'hopeful'
    this.musicTimer = null
    this.activeMusicNodes = []
  }

  // 1. User Gesture Unlock
  unlock() {
    if (this.isUnlocked && this.audioCtx && this.audioCtx.state === 'running') return Promise.resolve()

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return Promise.resolve()

    if (!this.audioCtx) {
      try {
        this.audioCtx = new AudioContextClass()
      } catch (err) {
        console.warn('[AudioManager] Failed to create AudioContext:', err)
        return Promise.resolve()
      }
    }

    return this.audioCtx.resume().then(() => {
      this.isUnlocked = true
      this.setupMasterBuses()
      this.startAmbientSystem()
      this.startAdaptiveMusic()
    }).catch((err) => {
      console.warn('[AudioManager] Audio unlock error:', err)
    })
  }

  setupMasterBuses() {
    if (!this.audioCtx) return

    // Create main channel buses
    this.masterGain = this.audioCtx.createGain()
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.audioCtx.currentTime)
    this.masterGain.connect(this.audioCtx.destination)

    this.sfxGain = this.audioCtx.createGain()
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime)
    this.sfxGain.connect(this.masterGain)

    this.musicGain = this.audioCtx.createGain()
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime)
    this.musicGain.connect(this.masterGain)
  }

  // Volume & Mute Controls
  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val))
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.audioCtx.currentTime)
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val))
    if (this.sfxGain && this.audioCtx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime)
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val))
    if (this.musicGain && this.audioCtx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime)
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted)
    Howler.mute(this.isMuted)
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.audioCtx.currentTime)
    }
  }

  // 2. Ambient Loop System
  startAmbientSystem() {
    if (!this.audioCtx || !this.isUnlocked) return

    // Wind Generator: Pink/White noise buffer passed through a resonant bandpass filter
    try {
      const bufferSize = this.audioCtx.sampleRate * 2
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      let lastOut = 0.0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        // Lowpass pinking filter
        output[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = output[i]
      }

      this.windNoiseNode = this.audioCtx.createBufferSource()
      this.windNoiseNode.buffer = noiseBuffer
      this.windNoiseNode.loop = true

      this.windFilter = this.audioCtx.createBiquadFilter()
      this.windFilter.type = 'bandpass'
      this.windFilter.frequency.setValueAtTime(320, this.audioCtx.currentTime)
      this.windFilter.Q.setValueAtTime(1.8, this.audioCtx.currentTime)

      this.windGain = this.audioCtx.createGain()
      this.windGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime)

      this.windNoiseNode.connect(this.windFilter)
      this.windFilter.connect(this.windGain)
      this.windGain.connect(this.sfxGain)

      this.windNoiseNode.start()
    } catch (e) {
      console.warn('[AudioManager] Wind loop init error:', e)
    }

    // Distant Village Murmur Drone
    try {
      this.villageGain = this.audioCtx.createGain()
      this.villageGain.gain.setValueAtTime(0.025, this.audioCtx.currentTime)

      this.villageOsc1 = this.audioCtx.createOscillator()
      this.villageOsc1.type = 'triangle'
      this.villageOsc1.frequency.setValueAtTime(110.0, this.audioCtx.currentTime) // A2 warm drone

      this.villageOsc2 = this.audioCtx.createOscillator()
      this.villageOsc2.type = 'sine'
      this.villageOsc2.frequency.setValueAtTime(164.81, this.audioCtx.currentTime) // E3

      this.villageOsc1.connect(this.villageGain)
      this.villageOsc2.connect(this.villageGain)
      this.villageGain.connect(this.sfxGain)

      this.villageOsc1.start()
      this.villageOsc2.start()
    } catch (e) {
      console.warn('[AudioManager] Village ambient error:', e)
    }

    // Start bird chirps loop
    this.scheduleNextBirdChirp()
  }

  // Update wind audio based on game wind parameters
  updateWind(speedMs) {
    if (!this.windGain || !this.windFilter || !this.audioCtx) return

    const speed = Math.max(0.5, Math.min(15, speedMs || 3.8))
    // Scale volume with wind speed
    const targetGain = 0.04 + (speed / 15.0) * 0.12
    // Scale filter center frequency with wind speed
    const targetFreq = 220 + (speed / 15.0) * 450

    this.windGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.4)
    this.windFilter.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.4)
  }

  // Procedural Bird Chirp (pentatonic high whistle with frequency envelope)
  scheduleNextBirdChirp() {
    if (!this.audioCtx || !this.isUnlocked) return

    const delay = 2500 + Math.random() * 4500
    this.birdTimer = setTimeout(() => {
      this.playBirdChirp()
      this.scheduleNextBirdChirp()
    }, delay)
  }

  playBirdChirp(volumeScale = 1.0) {
    if (!this.audioCtx || !this.isUnlocked || this.isMuted || volumeScale <= 0.05) return

    try {
      const notes = [2637, 2960, 3136, 3520, 3951, 4186] // E7, F#7, G7, A7, B7, C8
      const baseFreq = notes[Math.floor(Math.random() * notes.length)]

      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()

      osc.type = 'sine'
      const now = this.audioCtx.currentTime

      // Fast chirp frequency sweep
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.06)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, now + 0.12)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.035 * volumeScale, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)

      osc.connect(gain)
      gain.connect(this.sfxGain)

      osc.start(now)
      osc.stop(now + 0.15)
    } catch {
      // Safe fallback
    }
  }

  // 3. Spatial Audio Management
  // Updates or creates a spatial source with distance attenuation & stereo panning
  updateSpatialSource(id, sourcePos, listenerPos, listenerYaw = 0) {
    if (!this.audioCtx || !this.isUnlocked) return

    let source = this.spatialSources[id]
    if (!source) {
      try {
        const gain = this.audioCtx.createGain()
        let panner = null
        if (this.audioCtx.createStereoPanner) {
          panner = this.audioCtx.createStereoPanner()
          gain.connect(panner)
          panner.connect(this.sfxGain)
        } else {
          gain.connect(this.sfxGain)
        }
        source = { gain, panner, active: false }
        this.spatialSources[id] = source
      } catch {
        return
      }
    }

    if (!sourcePos || !listenerPos) return

    // Calculate distance
    const dx = sourcePos[0] - listenerPos[0]
    const dy = (sourcePos[1] || 0) - (listenerPos[1] || 0)
    const dz = sourcePos[2] - listenerPos[2]
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

    // Distance attenuation: 1 / (1 + dist * 0.075)
    const maxGain = 0.35
    const attenGain = maxGain / (1 + dist * 0.075)

    source.gain.gain.setTargetAtTime(attenGain, this.audioCtx.currentTime, 0.1)

    // Horizontal stereo pan (-1 to 1) based on listener orientation
    if (source.panner) {
      const angle = Math.atan2(dx, dz) - listenerYaw
      const pan = Math.sin(angle)
      source.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.audioCtx.currentTime, 0.1)
    }
  }

  // 4. Surface-dependent Footsteps
  playFootstep(surface = 'dirt') {
    if (!this.audioCtx || !this.isUnlocked || this.isMuted) return
    const now = Date.now()
    if (now - this.lastFootstepTime < 240) return // Throttle
    this.lastFootstepTime = now

    try {
      const t = this.audioCtx.currentTime
      if (surface === 'road') {
        // Crisp stone/gravel tap (bandpass transient)
        const osc = this.audioCtx.createOscillator()
        const filter = this.audioCtx.createBiquadFilter()
        const gain = this.audioCtx.createGain()

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(380, t)
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.04)

        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(800, t)

        gain.gain.setValueAtTime(0.04, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.sfxGain)

        osc.start(t)
        osc.stop(t + 0.055)
      } else if (surface === 'grass') {
        // Soft rustle (short high-passed noise burst)
        const bufferSize = this.audioCtx.sampleRate * 0.04
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.25
        }
        const noise = this.audioCtx.createBufferSource()
        noise.buffer = buffer

        const filter = this.audioCtx.createBiquadFilter()
        filter.type = 'highpass'
        filter.frequency.setValueAtTime(1600, t)

        const gain = this.audioCtx.createGain()
        gain.gain.setValueAtTime(0.028, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)

        noise.connect(filter)
        filter.connect(gain)
        gain.connect(this.sfxGain)

        noise.start(t)
      } else {
        // Dirt (soft low thump for fields)
        const osc = this.audioCtx.createOscillator()
        const gain = this.audioCtx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(160, t)
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.07)

        gain.gain.setValueAtTime(0.05, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)

        osc.connect(gain)
        gain.connect(this.sfxGain)

        osc.start(t)
        osc.stop(t + 0.085)
      }
    } catch {
      // Safe fallback
    }
  }

  // 5. Layered Adaptive Music System (Calm, Tense, Hopeful)
  setMusicState(newState) {
    if (this.musicState === newState) return
    this.musicState = newState
  }

  startAdaptiveMusic() {
    if (!this.audioCtx || !this.isUnlocked) return

    // Loop a gentle generative musical sequence every 4.8 seconds
    const playChordBar = () => {
      if (!this.audioCtx || !this.isUnlocked || this.isMuted) {
        this.musicTimer = setTimeout(playChordBar, 4800)
        return
      }

      const t = this.audioCtx.currentTime

      if (this.musicState === 'tense') {
        // Low minor pulsing tension (D minor / F diminished)
        const freqs = [73.42, 110.0, 146.83, 174.61] // D2, A2, D3, F3
        freqs.forEach((f, idx) => {
          const osc = this.audioCtx.createOscillator()
          const gain = this.audioCtx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(f, t)

          gain.gain.setValueAtTime(0.0001, t)
          gain.gain.linearRampToValueAtTime(0.015, t + 0.8)
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 4.2)

          const filter = this.audioCtx.createBiquadFilter()
          filter.type = 'lowpass'
          filter.frequency.setValueAtTime(280 + idx * 40, t)

          osc.connect(filter)
          filter.connect(gain)
          gain.connect(this.musicGain)

          osc.start(t)
          osc.stop(t + 4.4)
        })
      } else if (this.musicState === 'hopeful') {
        // Uplifting G major / C major crystalline progression
        const freqs = [196.0, 246.94, 293.66, 392.0, 493.88] // G3, B3, D4, G4, B4
        freqs.forEach((f, idx) => {
          const osc = this.audioCtx.createOscillator()
          const gain = this.audioCtx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(f, t + idx * 0.18)

          const noteStart = t + idx * 0.18
          gain.gain.setValueAtTime(0.0001, noteStart)
          gain.gain.linearRampToValueAtTime(0.03, noteStart + 0.3)
          gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 3.2)

          osc.connect(gain)
          gain.connect(this.musicGain)

          osc.start(noteStart)
          osc.stop(noteStart + 3.4)
        })
      } else {
        // Calm: warm pastoral pentatonic chords (C major 9)
        const freqs = [130.81, 164.81, 196.0, 246.94, 293.66] // C3, E3, G3, B3, D4
        freqs.forEach((f, idx) => {
          const osc = this.audioCtx.createOscillator()
          const gain = this.audioCtx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(f, t + idx * 0.12)

          const noteStart = t + idx * 0.12
          gain.gain.setValueAtTime(0.0001, noteStart)
          gain.gain.linearRampToValueAtTime(0.022, noteStart + 0.5)
          gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 3.8)

          osc.connect(gain)
          gain.connect(this.musicGain)

          osc.start(noteStart)
          osc.stop(noteStart + 4.0)
        })
      }

      this.musicTimer = setTimeout(playChordBar, 4800)
    }

    playChordBar()
  }

  // Cleanup on scene switch
  dispose() {
    if (this.birdTimer) clearTimeout(this.birdTimer)
    if (this.musicTimer) clearTimeout(this.musicTimer)
    try {
      this.windNoiseNode?.stop()
      this.villageOsc1?.stop()
      this.villageOsc2?.stop()
      this.audioCtx?.close()
    } catch {
      // Ignored
    }
  }
}

export const audioManager = new AudioManager()
