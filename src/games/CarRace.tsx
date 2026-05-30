import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import GameShell from './GameShell'
import { Button } from '../components/ui'

const KEY = 'car'
const W = 360, H = 560
const LANES = 3
const laneX = (i: number) => 40 + i * ((W - 80) / LANES) + ((W - 80) / LANES) / 2

export default function CarRace() {
  const { bestScores, setBest, awardPoints, touchStreak } = useStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)
  const [running, setRunning] = useState(false)
  const s = useRef<any>(null)
  const move = useRef(0) // -1 left, 1 right, 0 none

  function reset() {
    s.current = { lane: 1, x: laneX(1), road: 0, speed: 5, enemies: [] as any[], coins: [] as any[], spawn: 0, score: 0, dead: false }
    setScore(0); setOver(false)
  }
  useEffect(() => { reset() }, [])

  function steer(dir: number) {
    if (!running) { setRunning(true); return }
    const st = s.current
    st.lane = Math.max(0, Math.min(LANES - 1, st.lane + dir))
  }

  useEffect(() => {
    if (!running || over) return
    const ctx = canvasRef.current!.getContext('2d')!
    let raf = 0
    const brand = (getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()) || '124 92 255'

    function carSprite(x: number, y: number, color: string, w = 46, h = 80) {
      ctx.save()
      ctx.translate(x, y)
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, h / 2 - 4, w / 2, 8, 0, 0, 7); ctx.fill()
      // body
      const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0)
      g.addColorStop(0, color); g.addColorStop(0.5, '#ffffff22'); g.addColorStop(1, color)
      ctx.fillStyle = color
      rr(ctx, -w / 2, -h / 2, w, h, 12); ctx.fill()
      ctx.fillStyle = g; rr(ctx, -w / 2, -h / 2, w, h, 12); ctx.fill()
      // windows
      ctx.fillStyle = 'rgba(10,15,30,0.85)'
      rr(ctx, -w / 2 + 7, -h / 2 + 12, w - 14, 18, 6); ctx.fill()
      rr(ctx, -w / 2 + 7, 6, w - 14, 20, 6); ctx.fill()
      // wheels
      ctx.fillStyle = '#111'
      ctx.fillRect(-w / 2 - 3, -h / 2 + 14, 5, 18)
      ctx.fillRect(w / 2 - 2, -h / 2 + 14, 5, 18)
      ctx.fillRect(-w / 2 - 3, h / 2 - 32, 5, 18)
      ctx.fillRect(w / 2 - 2, h / 2 - 32, 5, 18)
      ctx.restore()
    }

    const loop = () => {
      const st = s.current
      // smooth lane glide
      st.x += (laneX(st.lane) - st.x) * 0.25
      st.road = (st.road + st.speed) % 80
      st.speed += 0.0025
      st.score += 0.05
      st.spawn -= st.speed
      if (st.spawn <= 0) {
        st.spawn = 200 + Math.random() * 120
        const lane = Math.floor(Math.random() * LANES)
        st.enemies.push({ lane, x: laneX(lane), y: -90, color: ['#f43f5e', '#3b82f6', '#22c55e', '#f59e0b'][Math.floor(Math.random() * 4)] })
        if (Math.random() < 0.6) { const cl = Math.floor(Math.random() * LANES); st.coins.push({ x: laneX(cl), y: -180 }) }
      }
      st.enemies.forEach((e: any) => (e.y += st.speed))
      st.coins.forEach((c: any) => (c.y += st.speed))
      st.enemies = st.enemies.filter((e: any) => e.y < H + 90)
      st.coins = st.coins.filter((c: any) => c.y < H + 30 && !c.got)

      const py = H - 70
      for (const e of st.enemies) {
        if (Math.abs(e.x - st.x) < 44 && Math.abs(e.y - py) < 76) st.dead = true
      }
      for (const c of st.coins) {
        if (!c.got && Math.abs(c.x - st.x) < 30 && Math.abs(c.y - py) < 40) { c.got = true; st.score += 10 }
      }

      // draw road
      ctx.fillStyle = '#0c1018'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#1a2030'; ctx.fillRect(30, 0, W - 60, H) // tarmac
      // edges
      ctx.fillStyle = 'rgb(' + brand + ')'; ctx.fillRect(26, 0, 4, H); ctx.fillRect(W - 30, 0, 4, H)
      // lane dashes
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      for (let l = 1; l < LANES; l++) {
        const lx = 40 + l * ((W - 80) / LANES) - 2
        for (let y = -80 + st.road; y < H; y += 80) ctx.fillRect(lx, y, 4, 40)
      }
      // coins
      for (const c of st.coins) { ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(c.x, c.y, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#b45309'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', c.x, c.y + 4) }
      // enemies + player
      for (const e of st.enemies) carSprite(e.x, e.y, e.color)
      carSprite(st.x, py, 'rgb(' + brand + ')')

      setScore(Math.floor(st.score))
      if (st.dead) { setOver(true); setRunning(false); return }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, over])

  useEffect(() => {
    if (over) { setBest(KEY, score); if (score > 0) { awardPoints(Math.ceil(score / 8)); touchStreak() } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') steer(-1); if (e.key === 'ArrowRight') steer(1) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const touchStart = useRef<number | null>(null)
  function restart() { reset(); setRunning(true) }

  return (
    <GameShell title="Car Racing 🏎️" score={score} best={bestScores[KEY] || 0}>
      <div
        className="relative w-full max-w-[360px]"
        onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart.current == null) return
          const dx = e.changedTouches[0].clientX - touchStart.current
          if (Math.abs(dx) > 24) steer(dx > 0 ? 1 : -1)
          else if (!running) setRunning(true)
          touchStart.current = null
        }}
      >
        <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-3xl border border-line" />
        {!running && !over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-black/55 text-center">
            <p className="text-5xl">🏎️</p>
            <p className="mt-2 font-bold">Swipe or use arrows to switch lanes</p>
            <Button className="mt-4" onClick={() => setRunning(true)}>Start race</Button>
          </div>
        )}
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-black/70 text-center">
            <p className="text-2xl font-extrabold">💥 Crashed!</p>
            <p className="text-muted">Score {score} · +{Math.ceil(score / 8)} pts</p>
            <Button className="mt-3" onClick={restart}>Race again</Button>
          </div>
        )}
      </div>
      <div className="mt-4 flex w-full max-w-[360px] gap-3">
        <button onClick={() => steer(-1)} className="flex flex-1 items-center justify-center rounded-2xl bg-card border border-line py-4 active:scale-95"><ChevronLeft size={28} /></button>
        <button onClick={() => steer(1)} className="flex flex-1 items-center justify-center rounded-2xl bg-card border border-line py-4 active:scale-95"><ChevronRight size={28} /></button>
      </div>
    </GameShell>
  )
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
