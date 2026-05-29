import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Pin, Search, X, Archive, CheckSquare, Square, ListChecks, StickyNote,
} from 'lucide-react'
import { useStore, type Note } from '../lib/store'
import { EmptyState } from '../components/ui'
import { fontClass, noteBgCss } from './NoteEditor'

const uid = () => Math.random().toString(36).slice(2)

export default function Notes() {
  const { notes, addNote } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [activeLabel, setActiveLabel] = useState('')

  const allLabels = useMemo(() => Array.from(new Set(notes.flatMap((n) => n.labels || []))), [notes])

  function openNew(asChecklist = false) {
    const id = addNote({ isChecklist: asChecklist, checklist: asChecklist ? [{ id: uid(), text: '', done: false }] : [] })
    nav(`/note/${id}`)
  }

  const term = q.toLowerCase().trim()
  const visible = notes
    .filter((n) => n.archived === showArchived)
    .filter((n) => !activeLabel || n.labels.includes(activeLabel))
    .filter((n) =>
      !term ||
      n.title.toLowerCase().includes(term) ||
      n.body.toLowerCase().includes(term) ||
      n.labels.some((l) => l.toLowerCase().includes(term)) ||
      n.checklist.some((c) => c.text.toLowerCase().includes(term)),
    )
  const pinned = visible.filter((n) => n.pinned)
  const others = visible.filter((n) => !n.pinned)

  const grid = (list: Note[]) => (
    <div className="columns-2 gap-3 [&>*]:mb-3">
      {list.map((n) => {
        const doneCount = n.checklist.filter((c) => c.done).length
        const bg = noteBgCss(n.bg) || (n.color ? `rgb(${n.color} / 0.16)` : 'rgb(var(--card))')
        return (
          <button
            key={n.id}
            onClick={() => nav(`/note/${n.id}`)}
            className={`block w-full break-inside-avoid rounded-3xl border border-line/60 p-4 text-left transition active:scale-[0.98] animate-fade-up ${fontClass(n.font)}`}
            style={{ background: bg }}
          >
            {n.pinned && <Pin size={14} className="mb-1.5 text-brand" fill="currentColor" />}
            {n.title && <p className="mb-1.5 font-semibold leading-snug">{n.title}</p>}
            {n.isChecklist ? (
              <div className="space-y-1.5">
                {n.checklist.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-start gap-2 text-sm">
                    {c.done ? <CheckSquare size={15} className="mt-0.5 shrink-0 text-brand" /> : <Square size={15} className="mt-0.5 shrink-0 text-muted" />}
                    <span className={c.done ? 'text-muted line-through' : ''}>{c.text || '—'}</span>
                  </div>
                ))}
                {n.checklist.length > 6 && <p className="text-xs text-muted">+{n.checklist.length - 6} more · {doneCount}/{n.checklist.length} done</p>}
              </div>
            ) : (
              n.body && <div className="prose-preview text-sm leading-relaxed text-muted line-clamp-[12]" dangerouslySetInnerHTML={{ __html: n.body }} />
            )}
            {n.labels.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {n.labels.map((l) => (
                  <span key={l} className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-medium text-brand">{l}</span>
                ))}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="safe-top px-5 pb-6">
      <div className="flex items-center justify-between pt-5 pb-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Notes</h1>
        <button onClick={() => setShowArchived((v) => !v)} className={`grid h-11 w-11 place-items-center rounded-2xl border border-line ${showArchived ? 'bg-brand/15 text-brand' : 'bg-card text-muted'}`}>
          <Archive size={19} />
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-card border border-line px-4 py-1">
        <Search size={18} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes, lists, labels…" className="flex-1 bg-transparent py-3 outline-none placeholder:text-muted" />
        {q && <button onClick={() => setQ('')}><X size={18} className="text-muted" /></button>}
      </div>

      {allLabels.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveLabel('')} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${!activeLabel ? 'bg-brand text-white' : 'bg-card text-muted border border-line'}`}>All</button>
          {allLabels.map((l) => (
            <button key={l} onClick={() => setActiveLabel(l)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${activeLabel === l ? 'bg-brand text-white' : 'bg-card text-muted border border-line'}`}>{l}</button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState icon={<StickyNote />} title={showArchived ? 'No archived notes' : 'Your notes live here'} hint={showArchived ? undefined : 'Capture ideas, checklists and reminders. Tap + to start.'} />
      ) : (
        <>
          {pinned.length > 0 && <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Pinned</p>}
          {pinned.length > 0 && grid(pinned)}
          {others.length > 0 && pinned.length > 0 && <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-widest text-muted">Others</p>}
          {grid(others)}
        </>
      )}

      {!showArchived && (
        <div className="fixed bottom-28 left-1/2 z-30 flex -translate-x-1/2 gap-3">
          <button onClick={() => openNew(true)} className="flex items-center gap-2 rounded-full bg-card border border-line px-5 py-3.5 font-semibold shadow-soft">
            <ListChecks size={20} /> List
          </button>
          <button onClick={() => openNew(false)} className="flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-white shadow-glow">
            <Plus size={20} /> Note
          </button>
        </div>
      )}
    </div>
  )
}
