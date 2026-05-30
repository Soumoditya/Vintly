import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react'

export default function GameShell({
  title,
  best,
  score,
  onRestart,
  children,
  footer,
}: {
  title: string
  best?: number
  score?: number
  onRestart?: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const nav = useNavigate()
  return (
    <div className="safe-top flex min-h-screen flex-col px-5 pb-6">
      <header className="flex items-center justify-between py-4">
        <button onClick={() => nav('/games')} className="grid h-11 w-11 place-items-center rounded-2xl bg-card border border-line"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-extrabold">{title}</h1>
        {onRestart ? (
          <button onClick={onRestart} className="grid h-11 w-11 place-items-center rounded-2xl bg-card border border-line"><RotateCcw size={18} /></button>
        ) : <span className="w-11" />}
      </header>

      {(score != null || best != null) && (
        <div className="mb-4 flex gap-3">
          {score != null && (
            <div className="flex-1 rounded-2xl bg-card border border-line p-3 text-center">
              <p className="text-xs text-muted">Score</p>
              <p className="text-2xl font-extrabold">{score}</p>
            </div>
          )}
          {best != null && (
            <div className="flex-1 rounded-2xl bg-card border border-line p-3 text-center">
              <p className="flex items-center justify-center gap-1 text-xs text-muted"><Trophy size={12} className="text-amber-400" /> Best</p>
              <p className="text-2xl font-extrabold">{best}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}
