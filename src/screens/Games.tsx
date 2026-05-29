import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy } from 'lucide-react'
import { useStore } from '../lib/store'

const GAMES = [
  { id: 'math', name: 'Quick Math', emoji: '⚡', desc: 'Beat the clock', tint: '245 158 11', key: 'quickmath' },
  { id: '2048', name: '2048', emoji: '🔢', desc: 'Merge to win', tint: '124 92 255', key: '2048' },
  { id: 'puzzle', name: 'Sliding Puzzle', emoji: '🧩', desc: 'Arrange the tiles', tint: '16 185 129', key: '' },
  { id: 'memory', name: 'Memory Match', emoji: '🃏', desc: 'Find the pairs', tint: '236 72 153', key: '' },
  { id: 'snake', name: 'Snake', emoji: '🐍', desc: 'Classic & calm', tint: '14 165 233', key: 'snake' },
  { id: 'dash', name: 'Vintly Dash', emoji: '🏃', desc: 'Endless runner', tint: '244 63 94', key: 'runner' },
]

export default function Games() {
  const bestScores = useStore((s) => s.bestScores)
  return (
    <div className="safe-top px-5 pb-6">
      <div className="flex items-center gap-3 pt-5 pb-2">
        <Link to="/" className="grid h-11 w-11 place-items-center rounded-2xl bg-card border border-line"><ArrowLeft size={18} /></Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Games</h1>
      </div>
      <p className="mb-5 text-sm text-muted">Take a mindful break — every game earns you Vintly points. 🎮</p>

      <div className="grid grid-cols-2 gap-4">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            to={`/games/${g.id}`}
            className="flex flex-col gap-2 rounded-3xl border border-line p-5 transition active:scale-[0.97]"
            style={{ background: `linear-gradient(160deg, rgb(${g.tint} / 0.18), transparent)` }}
          >
            <span className="text-4xl">{g.emoji}</span>
            <span className="font-bold leading-tight">{g.name}</span>
            <span className="text-xs text-muted">{g.desc}</span>
            {g.key && bestScores[g.key] ? (
              <span className="mt-1 flex items-center gap-1 text-xs font-semibold" style={{ color: `rgb(${g.tint})` }}>
                <Trophy size={12} /> Best {bestScores[g.key]}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  )
}
