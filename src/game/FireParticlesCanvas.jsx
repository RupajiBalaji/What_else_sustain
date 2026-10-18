/**
 * FireParticlesCanvas.jsx
 * Canvas 2D particle simulation for hold-to-light stubble burning and smoke dispersal.
 * Optimized for 60fps on mobile without heavy DOM churn.
 */

import React, { useRef, useEffect } from 'react'

export default function FireParticlesCanvas({ isBurning = false, burnProgress = 0 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth || 360
      canvas.height = canvas.parentElement.clientHeight || 240
    }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor(originX, originY, type = 'fire') {
        this.x = originX + (Math.random() * 60 - 30)
        this.y = originY + (Math.random() * 20 - 10)
        this.type = type
        if (type === 'fire') {
          this.vx = (Math.random() - 0.5) * 1.5
          this.vy = -(1.5 + Math.random() * 3)
          this.radius = 4 + Math.random() * 6
          this.life = 1.0
          this.decay = 0.02 + Math.random() * 0.03
          this.color = Math.random() > 0.4 ? '#FF5722' : '#FFC107'
        } else {
          // Smoke particle
          this.vx = (Math.random() - 0.5) * 2.2 + 0.8 // slight wind
          this.vy = -(0.8 + Math.random() * 2)
          this.radius = 6 + Math.random() * 12
          this.life = 0.9
          this.decay = 0.008 + Math.random() * 0.012
          this.color = Math.random() > 0.5 ? 'rgba(50,45,40,' : 'rgba(80,75,70,'
        }
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.life -= this.decay
        if (this.type === 'smoke') {
          this.radius += 0.25 // expands as it rises
        } else {
          this.radius *= 0.96 // shrinks as flame dies
        }
      }

      draw(c) {
        if (this.life <= 0) return
        c.save()
        c.beginPath()
        c.arc(this.x, this.y, Math.max(0.5, this.radius), 0, Math.PI * 2)
        if (this.type === 'fire') {
          c.fillStyle = this.color
          c.globalAlpha = Math.max(0, this.life)
        } else {
          c.fillStyle = `${this.color}${Math.max(0, this.life * 0.55)})`
        }
        c.fill()
        c.restore()
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const originX = canvas.width * 0.65 // where straw pile sits
      const originY = canvas.height * 0.72

      // Spawn particles when holding/burning
      if (isBurning || burnProgress > 0.05) {
        const fireSpawnRate = isBurning ? Math.ceil(burnProgress * 6) : 2
        for (let i = 0; i < fireSpawnRate; i++) {
          particles.push(new Particle(originX, originY, 'fire'))
        }

        // Smoke particles rise high into sky
        if (burnProgress > 0.2) {
          const smokeCount = Math.ceil(burnProgress * 4)
          for (let i = 0; i < smokeCount; i++) {
            particles.push(new Particle(originX, originY - 15, 'smoke'))
          }
        }
      }

      // Update and filter living particles
      particles = particles.filter((p) => p.life > 0)
      for (const p of particles) {
        p.update()
        p.draw(ctx)
      }

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [isBurning, burnProgress])

  return (
    <canvas
      ref={canvasRef}
      className="fire-particles-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 12
      }}
    />
  )
}
