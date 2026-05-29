import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import GameShell from './GameShell'
import { Button } from '../components/ui'

const KEY = 'snake'
const N = 15
type P = { x: number; y: number }

export default function Snake() {
  const { bestScores, setBest, awardPoints, touchStreak } = useStore()
  const [snake, setSnake] = useState<P[]>([{ x: 7, y: 7 }])
  const [food, setFood] = useState<P>({ x: 4, y: 4 })
  const [over, setOver] = useState(false)
  const [running, setRunning] = useState(false)
  const dir = useRef<P>({ x: 1, y: 0 })
  const nextDir = useRef<P>({ x: 1, y: 0 })
  const touch = useRef<{ x: number; y: number } | null>(null)
  const score = snake.length - 1

  useEffect(() => {
    if (!running || over) return
    const id = setInterval(() => {
      setSnake((s) => {
        dir.current = nextDir.current
        const head = { x: s[0].x + dir.current.x, y: s[0].y + dir.current.y }
        if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || s.some((p) => p.x === head.x && p.y === head.y)) {
          setOver(true); setRunning(false)
          return s
        }
        const ns = [head, ...s]
        if (head.x === food.x && head.y === food.y) {
          let nf: P
          do { nf = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) } }
          while (ns.some((p) => p.x === nf.x && p.y === nf.y))
          setFood(nf)
        } else ns.pop()
        return ns
      })
    }, 160)
    return () => clearInterval(id)
  }, [running, over, food])

  useEffect(() => {
    if (over) { setBest(KEY, score); if (score > 0) { awardPoints(score * 2); touchStreak() } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const m: Record<string, P> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }
      const d = m[e.key]; if (d) turn(d)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function turn(d: P) {
    if (d.x === -dir.current.x && d.y === -dir.current.y) return // no reverse
    nextDir.current = d
    if (!running && !over) setRunning(true)
  }
  function onStart(e: React.TouchEvent) { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  function onEnd(e: React.TouchEvent) {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) { if (!running && !over) setRunning(true); return }
    if (Math.abs(dx) > Math.abs(dy)) turn({ x: dx > 0 ? 1 : -1, y: 0 })
    else turn({ x: 0, y: dy > 0 ? 1 : -1 })
    touch.current = null
  }
  function restart() { setSnake([{ x: 7, y: 7 }]); setFood({ x: 4, y: 4 }); dir.current = { x: 1, y: 0 }; nextDir.current = { x: 1, y: 0 }; setOver(false); setRunning(false) }

  return (
    <GameShell title="Snake 🐍" score={score} best={bestScores[KEY] || 0} onRestart={restart}>
      <div className="relative select-none rounded-3xl bg-card p-2" style={{ width: 'min(86vw, 360px)' }} onTouchStart={onStart} onTouchEnd={onEnd}>
        <div className="grid aspect-square w-full gap-px" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
          {Array.from({ length: N * N }).map((_, i) => {
            const x = i % N, y = Math.floor(i / N)
            const isHead = snake[0].x === x && snake[0].y === y
            const isBody = snake.some((p) => p.x === x && p.y === y)
            const isFood = food.x === x && food.y === y
            return <div key={i} className={`rounded-[3px] ${isHead ? 'bg-brand' : isBody ? 'bg-brand/60' : isFood ? 'bg-amber-400' : 'bg-surface'}`} />
          })}
        </div>
        {!running && !over && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/40">
            <Button onClick={() => setRunning(true)}>Tap / swipe to start</Button>
          </div>
        )}
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-black/70">
            <p className="text-2xl font-extrabold">Game over</p>
            <p className="text-muted">Length {score} · +{score * 2} pts</p>
            <Button className="mt-3" onClick={restart}>Play again</Button>
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-muted">Swipe to steer the snake. Eat the gold dots!</p>
    </GameShell>
  )
}
