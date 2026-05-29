import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import GameShell from './GameShell'
import { Button } from '../components/ui'

const KEY = '2048'
const SIZE = 4
type Grid = number[][]

const empty = (): Grid => Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
function addTile(g: Grid): Grid {
  const cells: [number, number][] = []
  g.forEach((row, r) => row.forEach((v, c) => v === 0 && cells.push([r, c])))
  if (!cells.length) return g
  const [r, c] = cells[Math.floor(Math.random() * cells.length)]
  g[r][c] = Math.random() < 0.9 ? 2 : 4
  return g
}
function clone(g: Grid): Grid { return g.map((r) => [...r]) }
function slide(row: number[]): [number[], number] {
  let arr = row.filter((v) => v)
  let gained = 0
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) { arr[i] *= 2; gained += arr[i]; arr.splice(i + 1, 1) }
  }
  while (arr.length < SIZE) arr.push(0)
  return [arr, gained]
}
function rotate(g: Grid): Grid {
  const n = empty()
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) n[c][SIZE - 1 - r] = g[r][c]
  return n
}
function move(g: Grid, dir: 'l' | 'r' | 'u' | 'd'): [Grid, number, boolean] {
  let rot = dir === 'l' ? 0 : dir === 'd' ? 1 : dir === 'r' ? 2 : 3
  let work = clone(g)
  for (let i = 0; i < rot; i++) work = rotate(work)
  let gained = 0
  const moved = work.map((row) => { const [nr, g2] = slide(row); gained += g2; return nr })
  let result = moved
  for (let i = 0; i < (4 - rot) % 4; i++) result = rotate(result)
  const changed = JSON.stringify(result) !== JSON.stringify(g)
  return [result, gained, changed]
}
function canMove(g: Grid): boolean {
  for (const d of ['l', 'r', 'u', 'd'] as const) if (move(g, d)[2]) return true
  return false
}

const COLORS: Record<number, string> = {
  0: 'bg-surface', 2: 'bg-brand/20', 4: 'bg-brand/35', 8: 'bg-amber-500/70', 16: 'bg-orange-500/80',
  32: 'bg-rose-500/80', 64: 'bg-rose-600', 128: 'bg-emerald-500', 256: 'bg-emerald-600',
  512: 'bg-sky-500', 1024: 'bg-indigo-500', 2048: 'bg-yellow-400',
}

export default function Game2048() {
  const { bestScores, setBest, awardPoints, touchStreak } = useStore()
  const [grid, setGrid] = useState<Grid>(() => addTile(addTile(empty())))
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)

  function doMove(dir: 'l' | 'r' | 'u' | 'd') {
    if (over) return
    setGrid((g) => {
      const [ng, gained, changed] = move(g, dir)
      if (!changed) return g
      addTile(ng)
      if (gained) setScore((s) => s + gained)
      if (!canMove(ng)) setOver(true)
      return ng
    })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const m: any = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd' }
      if (m[e.key]) { e.preventDefault(); doMove(m[e.key]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over])

  useEffect(() => {
    if (over) { setBest(KEY, score); if (score > 0) { awardPoints(Math.ceil(score / 50)); touchStreak() } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over])

  function onTouchStart(e: React.TouchEvent) { start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  function onTouchEnd(e: React.TouchEvent) {
    if (!start.current) return
    const dx = e.changedTouches[0].clientX - start.current.x
    const dy = e.changedTouches[0].clientY - start.current.y
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'r' : 'l')
    else doMove(dy > 0 ? 'd' : 'u')
    start.current = null
  }
  function restart() { setGrid(addTile(addTile(empty()))); setScore(0); setOver(false) }

  return (
    <GameShell title="2048 🔢" score={score} best={bestScores[KEY] || 0} onRestart={restart}>
      <div className="relative w-full max-w-xs select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="grid grid-cols-4 gap-2 rounded-3xl bg-card p-2">
          {grid.flat().map((v, i) => (
            <div key={i} className={`flex aspect-square items-center justify-center rounded-2xl text-xl font-extrabold ${COLORS[v] || 'bg-yellow-300'} ${v >= 8 ? 'text-white' : v ? 'text-ink' : ''}`}>
              {v || ''}
            </div>
          ))}
        </div>
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-black/70 text-center">
            <p className="text-2xl font-extrabold">Game over</p>
            <p className="mt-1 text-muted">Score {score}</p>
            <Button className="mt-4" onClick={restart}>Try again</Button>
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-muted">Swipe to merge tiles. Reach 2048!</p>
    </GameShell>
  )
}
