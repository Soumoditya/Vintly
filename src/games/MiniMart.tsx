import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import GameShell from './GameShell'
import { Button } from '../components/ui'

const KEY = 'mart'
const GOOD = ['🍎', '🍌', '🥕', '🍞', '🥛', '🧀', '🍓', '🥑', '🍅']
const BAD = ['💣', '🧨']

type Item = { id: number; x: number; y: number; emoji: string; bad: boolean; speed: number }

export default function MiniMart() {
  const { bestScores, setBest, awardPoints, touchStreak } = useStore()
  const [items, setItems] = useState<Item[]>([])
  const [cart, setCart] = useState(50) // % across
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [over, setOver] = useState(false)
  const [running, setRunning] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const cartRef = useRef(50)
  const liveRef = useRef(3)

  useEffect(() => { cartRef.current = cart }, [cart])

  useEffect(() => {
    if (!running || over) return
    let raf = 0, last = performance.now(), spawn = 0
    const tick = (t: number) => {
      const dt = Math.min(48, t - last); last = t
      spawn -= dt
      setItems((prev) => {
        let next = prev.map((it) => ({ ...it, y: it.y + it.speed * (dt / 16) }))
        if (spawn <= 0) {
          spawn = 620 - Math.min(380, score * 6)
          const bad = Math.random() < 0.22
          next.push({
            id: idRef.current++, x: 8 + Math.random() * 84, y: -6,
            emoji: bad ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)],
            bad, speed: 2.4 + Math.random() * 1.6 + score * 0.02,
          })
        }
        const kept: Item[] = []
        for (const it of next) {
          if (it.y >= 86 && it.y <= 100 && Math.abs(it.x - cartRef.current) < 12) {
            if (it.bad) { liveRef.current = 0; setLives(0); setOver(true) }
            else setScore((s) => s + 1)
            continue
          }
          if (it.y > 104) {
            if (!it.bad) { liveRef.current -= 1; setLives(liveRef.current); if (liveRef.current <= 0) setOver(true) }
            continue
          }
          kept.push(it)
        }
        return kept
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, over, score])

  useEffect(() => {
    if (over) { setBest(KEY, score); if (score > 0) { awardPoints(Math.ceil(score / 3)); touchStreak() } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over])

  function moveTo(clientX: number) {
    const el = areaRef.current; if (!el) return
    const r = el.getBoundingClientRect()
    setCart(Math.max(6, Math.min(94, ((clientX - r.left) / r.width) * 100)))
  }
  function restart() { setItems([]); setScore(0); setLives(3); liveRef.current = 3; setOver(false); setRunning(true) }

  return (
    <GameShell title="Mini Mart 🛒" score={score} best={bestScores[KEY] || 0}>
      <p className="mb-2 text-sm text-muted">{'❤️'.repeat(Math.max(0, lives))} · Drag to catch groceries, dodge 💣</p>
      <div
        ref={areaRef}
        className="relative w-full max-w-[360px] overflow-hidden rounded-3xl border border-line"
        style={{ height: 460, background: 'linear-gradient(180deg, rgb(var(--brand)/0.12), rgb(var(--card)))' }}
        onPointerMove={(e) => running && moveTo(e.clientX)}
        onPointerDown={(e) => { if (!running && !over) setRunning(true); moveTo(e.clientX) }}
      >
        {items.map((it) => (
          <div key={it.id} className="absolute text-3xl" style={{ left: `${it.x}%`, top: `${it.y}%`, transform: 'translate(-50%,-50%)' }}>{it.emoji}</div>
        ))}
        <div className="absolute text-4xl" style={{ left: `${cart}%`, top: '92%', transform: 'translate(-50%,-50%)' }}>🛒</div>

        {!running && !over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-center">
            <p className="text-5xl">🛒</p>
            <Button className="mt-4" onClick={() => setRunning(true)}>Open shop</Button>
          </div>
        )}
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-center">
            <p className="text-2xl font-extrabold">Shop closed!</p>
            <p className="text-muted">Caught {score} · +{Math.ceil(score / 3)} pts</p>
            <Button className="mt-3" onClick={restart}>Open again</Button>
          </div>
        )}
      </div>
    </GameShell>
  )
}
