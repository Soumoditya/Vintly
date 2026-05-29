import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import GameShell from './GameShell'
import { Button } from '../components/ui'

const KEY = 'puzzle'
const N = 3 // 3x3 (8-puzzle) — quick & peaceful

type Board = number[] // 0 = blank

function solved(): Board { return [...Array(N * N).keys()].map((i) => (i + 1) % (N * N)) }
function isSolved(b: Board) { return b.every((v, i) => v === solved()[i]) }
function neighbors(i: number): number[] {
  const r = Math.floor(i / N), c = i % N
  const out: number[] = []
  if (r > 0) out.push(i - N)
  if (r < N - 1) out.push(i + N)
  if (c > 0) out.push(i - 1)
  if (c < N - 1) out.push(i + 1)
  return out
}
function shuffle(): Board {
  let b = solved()
  let blank = b.indexOf(0)
  for (let i = 0; i < 200; i++) {
    const ns = neighbors(blank)
    const sw = ns[Math.floor(Math.random() * ns.length)]
    ;[b[blank], b[sw]] = [b[sw], b[blank]]
    blank = sw
  }
  return isSolved(b) ? shuffle() : b
}

export default function SlidingPuzzle() {
  const { awardPoints, touchStreak } = useStore()
  const [board, setBoard] = useState<Board>(shuffle)
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)

  function tap(i: number) {
    if (won) return
    const blank = board.indexOf(0)
    if (!neighbors(blank).includes(i)) return
    const nb = [...board]
    ;[nb[blank], nb[i]] = [nb[i], nb[blank]]
    setBoard(nb)
    setMoves((m) => m + 1)
    if (isSolved(nb)) setWon(true)
  }

  useEffect(() => {
    if (won) { awardPoints(15); touchStreak() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won])

  function restart() { setBoard(shuffle()); setMoves(0); setWon(false) }

  return (
    <GameShell title="Sliding Puzzle 🧩" score={moves} onRestart={restart}>
      <p className="mb-3 text-sm text-muted">Tap tiles next to the gap to arrange 1–8 in order.</p>
      <div className="relative grid grid-cols-3 gap-2 rounded-3xl bg-card p-2" style={{ width: 'min(78vw, 320px)' }}>
        {board.map((v, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            className={`flex aspect-square items-center justify-center rounded-2xl text-2xl font-extrabold transition active:scale-95 ${v === 0 ? 'opacity-0' : 'bg-brand/20 text-brand'}`}
          >
            {v || ''}
          </button>
        ))}
        {won && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-black/70 text-center">
            <p className="text-4xl">🎉</p>
            <p className="mt-2 text-2xl font-extrabold">Solved in {moves}!</p>
            <p className="text-muted">+15 points</p>
            <Button className="mt-4" onClick={restart}>Shuffle again</Button>
          </div>
        )}
      </div>
    </GameShell>
  )
}
