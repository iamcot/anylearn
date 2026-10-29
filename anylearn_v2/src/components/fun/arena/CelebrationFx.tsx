'use client'

import { useEffect, useRef } from 'react'

const COLORS = ['#ffd84d', '#ff6b6b', '#39ff88', '#4dabf7', '#f783ac', '#ffa94d', '#b197fc', '#ffffff']
const DURATION = 3200
const BURSTS = [0, 350, 800, 1250, 1700, 2100]

interface Particle { x: number; y: number; vx: number; vy: number; g: number; size: number; color: string; life: number; born: number; spin: number; angle: number; kind: 'spark' | 'paper' }

/**
 * About 3 seconds of fireworks and falling confetti over the whole screen (a canvas that ignores taps). Nothing is drawn for people who
 * asked their phone to reduce motion.
 */
export default function CelebrationFx() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const particles: Particle[] = []
    const start = performance.now()
    let burst = 0
    let raf = 0

    const explode = (t: number) => {
      const cx = w * (0.12 + Math.random() * 0.76)
      const cy = h * (0.1 + Math.random() * 0.45)
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      for (let i = 0; i < 34; i++) {
        const a = (Math.PI * 2 * i) / 34 + Math.random() * 0.2
        const sp = 2 + Math.random() * 3.6
        particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.06, size: 2.2, color, life: 900 + Math.random() * 500, born: t, spin: 0, angle: 0, kind: 'spark' })
      }
    }
    const paper = (t: number, n: number) => {
      for (let i = 0; i < n; i++) {
        particles.push({ x: Math.random() * w, y: -12 - Math.random() * 60, vx: (Math.random() - 0.5) * 1.6, vy: 1.6 + Math.random() * 2.4, g: 0.02, size: 5 + Math.random() * 5, color: COLORS[Math.floor(Math.random() * COLORS.length)], life: 2200, born: t, spin: (Math.random() - 0.5) * 0.3, angle: Math.random() * 6, kind: 'paper' })
      }
    }

    const frame = (now: number) => {
      const t = now - start
      ctx.clearRect(0, 0, w, h)
      while (burst < BURSTS.length && t >= BURSTS[burst]) {
        explode(t)
        paper(t, 22)
        burst++
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        const age = t - p.born
        if (age > p.life) { particles.splice(i, 1); continue }
        p.vy += p.g
        p.x += p.vx
        p.y += p.vy
        p.angle += p.spin
        const alpha = Math.max(0, 1 - age / p.life) * Math.max(0, Math.min(1, (DURATION + 600 - t) / 600))
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        if (p.kind === 'spark') {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.angle)
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
          ctx.restore()
        }
      }
      ctx.globalAlpha = 1
      if (t < DURATION + 600) raf = requestAnimationFrame(frame)
      else ctx.clearRect(0, 0, w, h)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[121] size-full" />
}
