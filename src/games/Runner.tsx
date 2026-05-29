import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import GameShell from './GameShell'
import { Button } from '../components/ui'

const KEY = 'runner'

export default function Runner() {
  const { bestScores, setBest, awardPoints, touchStreak } = useStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)
  const [running, setRunning] = useState(false)
  const state = useRef<any>(null)

  function reset() {
    state.current = {
      px: 60, py: 0, vy: 0, onGround: true,
      obstacles: [] as { x: number; w: number; h: number }[],
      coins: [] as { x: number; y: number; got: boolean }[],
      speed: 4.2, dist: 0, spawn: 0, score: 0, dead: false,
    }
    setScore(0); setOver(false)
  }

  useEffect(() => { reset() }, [])

  function jump() {
    if (over) return
    if (!running) { setRunning(true); return }
    const s = state.current
    if (s.onGround) { s.vy = -11.5; s.onGround = false }
  }

  useEffect(() => {
    if (!running || over) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const groundY = H - 40
    let raf = 0
    const brand = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '124 92 255'

    const loop = () => {
      const s = state.current
      // physics
      s.vy += 0.6; s.py += s.vy
      if (s.py >= 0) { s.py = 0; s.vy = 0; s.onGround = true }
      s.dist += s.speed; s.score = Math.floor(s.dist / 12)
      s.speed += 0.0015
      // spawn obstacles / coins
      s.spawn -= s.speed
      if (s.spawn <= 0) {
        s.spawn = 220 + Math.random() * 160
        const h = 28 + Math.random() * 26
        s.obstacles.push({ x: W + 20, w: 22 + Math.random() * 14, h })
        if (Math.random() < 0.7) s.coins.push({ x: W + 20 + 80, y: groundY - 70 - Math.random() * 40, got: false })
      }
      s.obstacles.forEach((o: any) => (o.x -= s.speed))
      s.coins.forEach((c: any) => (c.x -= s.speed))
      s.obstacles = s.obstacles.filter((o: any) => o.x + o.w > -10)
      s.coins = s.coins.filter((c: any) => c.x > -10 && !c.got)

      // player box
      const pw = 26, ph = 34
      const pxL = s.px, pyT = groundY - ph + s.py
      // collisions
      for (const o of s.obstacles) {
        if (pxL < o.x + o.w && pxL + pw > o.x && pyT + ph > groundY - o.h) { s.dead = true }
      }
      for (const c of s.coins) {
        if (!c.got && Math.abs(c.x - (pxL + pw / 2)) < 20 && Math.abs(c.y - (pyT + ph / 2)) < 24) { c.got = true; s.score += 5 }
      }

      // draw
      ctx.clearRect(0, 0, W, H)
      // sky gradient
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, 'rgba(' + brand + ',0.15)'); g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      // ground
      ctx.fillStyle = 'rgba(' + brand + ',0.35)'; ctx.fillRect(0, groundY, W, 4)
      // coins
      for (const c of s.coins) { ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, 7); ctx.fill() }
      // obstacles
      ctx.fillStyle = '#f43f5e'
      for (const o of s.obstacles) ctx.fillRect(o.x, groundY - o.h, o.w, o.h)
      // player
      ctx.fillStyle = 'rgb(' + brand + ')'
      ctx.fillRect(pxL, pyT, pw, ph)
      ctx.fillStyle = '#fff'; ctx.fillRect(pxL + pw - 9, pyT + 8, 4, 4)

      setScore(s.score)
      if (s.dead) { setOver(true); setRunning(false); return }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, over])

  useEffect(() => {
    if (over) { setBest(KEY, score); if (score > 0) { awardPoints(Math.ceil(score / 10)); touchStreak() } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); jump() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function restart() { reset(); setRunning(true) }

  return (
    <GameShell title="Vintly Dash 🏃" score={score} best={bestScores[KEY] || 0}>
      <div className="w-full" onPointerDown={jump}>
        <canvas ref={canvasRef} width={340} height={300} className="w-full rounded-3xl bg-card border border-line" />
        <p className="mt-3 text-center text-sm text-muted">Tap anywhere to jump. Dodge red blocks, grab gold coins!</p>
      </div>
      {!running && !over && <Button className="mt-4" onClick={() => setRunning(true)}>Start running</Button>}
      {over && (
        <div className="mt-4 text-center">
          <p className="text-xl font-extrabold">Crashed! Score {score}</p>
          <Button className="mt-2" onClick={restart}>Run again</Button>
        </div>
      )}
    </GameShell>
  )
}
