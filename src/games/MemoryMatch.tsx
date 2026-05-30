import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import GameShell from './GameShell'
import { Button } from '../components/ui'

const EMOJIS = ['🍎', '🚀', '🌟', '🐱', '🌈', '⚽', '🎵', '🍕']
type Card = { id: number; emoji: string; flipped: boolean; matched: boolean }

function build(): Card[] {
  return [...EMOJIS, ...EMOJIS]
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5)
    .map((c, i) => ({ ...c, id: i }))
}

export default function MemoryMatch() {
  const { awardPoints, touchStreak } = useStore()
  const [cards, setCards] = useState<Card[]>(build)
  const [open, setOpen] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [busy, setBusy] = useState(false)

  const won = cards.length > 0 && cards.every((c) => c.matched)

  useEffect(() => {
    if (won) { awardPoints(20); touchStreak() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won])

  function flip(i: number) {
    if (busy || cards[i].flipped || cards[i].matched) return
    const nc = cards.map((c, idx) => (idx === i ? { ...c, flipped: true } : c))
    const no = [...open, i]
    setCards(nc)
    setOpen(no)
    if (no.length === 2) {
      setMoves((m) => m + 1)
      setBusy(true)
      const [a, b] = no
      if (nc[a].emoji === nc[b].emoji) {
        setTimeout(() => {
          setCards((cs) => cs.map((c, idx) => (idx === a || idx === b ? { ...c, matched: true } : c)))
          setOpen([]); setBusy(false)
        }, 350)
      } else {
        setTimeout(() => {
          setCards((cs) => cs.map((c, idx) => (idx === a || idx === b ? { ...c, flipped: false } : c)))
          setOpen([]); setBusy(false)
        }, 700)
      }
    }
  }

  function restart() { setCards(build()); setOpen([]); setMoves(0); setBusy(false) }

  return (
    <GameShell title="Memory Match 🃏" score={moves} onRestart={restart}>
      <p className="mb-4 text-sm text-muted">Flip cards to find matching pairs.</p>
      <div className="grid grid-cols-4 gap-2.5" style={{ width: 'min(86vw, 360px)' }}>
        {cards.map((c, i) => (
          <button
            key={c.id}
            onClick={() => flip(i)}
            className={`flex aspect-square items-center justify-center rounded-2xl text-3xl transition-all duration-200 ${
              c.flipped || c.matched ? 'bg-card border border-line' : 'bg-brand/80'
            } ${c.matched ? 'opacity-40' : ''}`}
          >
            {(c.flipped || c.matched) ? c.emoji : ''}
          </button>
        ))}
      </div>
      {won && (
        <div className="mt-6 text-center animate-pop">
          <p className="text-3xl">🎉</p>
          <p className="text-xl font-extrabold">Cleared in {moves} moves!</p>
          <p className="text-muted">+20 points</p>
          <Button className="mt-3" onClick={restart}>Play again</Button>
        </div>
      )}
    </GameShell>
  )
}
