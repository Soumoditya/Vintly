import { useEffect, useState, useCallback } from 'react'
import { useStore } from '../lib/store'
import GameShell from './GameShell'
import { Button } from '../components/ui'

type Q = { text: string; answer: number; options: number[] }
const KEY = 'quickmath'

function makeQ(level: number): Q {
  const ops = ['+', '-', '×'] as const
  const op = ops[Math.floor(Math.random() * (level > 3 ? 3 : 2))]
  const max = 9 + level * 4
  let a = 1 + Math.floor(Math.random() * max)
  let b = 1 + Math.floor(Math.random() * max)
  let ans = 0
  if (op === '+') ans = a + b
  else if (op === '-') { if (b > a) [a, b] = [b, a]; ans = a - b }
  else { a = 1 + Math.floor(Math.random() * 12); b = 1 + Math.floor(Math.random() * 12); ans = a * b }
  const opts = new Set<number>([ans])
  while (opts.size < 4) opts.add(Math.max(0, ans + (Math.floor(Math.random() * 11) - 5)))
  return { text: `${a} ${op} ${b}`, answer: ans, options: [...opts].sort(() => Math.random() - 0.5) }
}

export default function QuickMath() {
  const { bestScores, setBest, awardPoints, touchStreak } = useStore()
  const [q, setQ] = useState<Q>(() => makeQ(1))
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(30)
  const [over, setOver] = useState(false)
  const [flash, setFlash] = useState<'ok' | 'no' | null>(null)

  useEffect(() => {
    if (over) return
    if (time <= 0) { setOver(true); return }
    const t = setTimeout(() => setTime((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [time, over])

  useEffect(() => {
    if (over) {
      setBest(KEY, score)
      if (score > 0) { awardPoints(Math.ceil(score / 2)); touchStreak() }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over])

  const answer = useCallback((n: number) => {
    if (over) return
    if (n === q.answer) {
      setScore((s) => s + 1)
      setTime((t) => Math.min(30, t + 1))
      setFlash('ok')
      setQ(makeQ(1 + Math.floor((score + 1) / 5)))
    } else {
      setTime((t) => Math.max(0, t - 3))
      setFlash('no')
    }
    setTimeout(() => setFlash(null), 200)
  }, [q, over, score])

  function restart() { setScore(0); setTime(30); setOver(false); setQ(makeQ(1)) }

  return (
    <GameShell title="Quick Math ⚡" score={score} best={bestScores[KEY] || 0} onRestart={restart}>
      {over ? (
        <div className="text-center">
          <p className="text-5xl">🧠</p>
          <p className="mt-3 text-2xl font-extrabold">Time's up!</p>
          <p className="mt-1 text-muted">You solved <b>{score}</b> · earned <b>+{Math.ceil(score / 2)}</b> points</p>
          <Button className="mt-6" onClick={restart}>Play again</Button>
        </div>
      ) : (
        <div className="w-full">
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full bg-brand transition-all" style={{ width: `${(time / 30) * 100}%` }} />
          </div>
          <div className={`mb-8 rounded-3xl border border-line p-10 text-center transition ${flash === 'ok' ? 'bg-emerald-500/15' : flash === 'no' ? 'bg-rose-500/15' : 'bg-card'}`}>
            <p className="text-5xl font-extrabold">{q.text}</p>
            <p className="mt-2 text-sm text-muted">{time}s left</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((o, i) => (
              <button key={i} onClick={() => answer(o)} className="rounded-2xl bg-card border border-line py-6 text-2xl font-bold active:scale-95">{o}</button>
            ))}
          </div>
        </div>
      )}
    </GameShell>
  )
}
