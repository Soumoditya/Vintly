import { useMemo, useState } from 'react'
import {
  Plus, Pin, Trash2, X, Search, CheckSquare, Square, Archive, ArchiveRestore,
  ListChecks, Tag, StickyNote, Check,
} from 'lucide-react'
import { useStore, type Note, type ChecklistItem } from '../lib/store'
import { Sheet, Input, EmptyState } from '../components/ui'

const COLORS = ['', '124 92 255', '16 185 129', '244 63 94', '245 158 11', '14 165 233', '236 72 153']
const uid = () => Math.random().toString(36).slice(2)

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useStore()
  const [editing, setEditing] = useState<Note | null>(null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [labelInput, setLabelInput] = useState('')

  const allLabels = useMemo(
    () => Array.from(new Set(notes.flatMap((n) => n.labels || []))),
    [notes],
  )

  function openNew(asChecklist = false) {
    const id = addNote({ isChecklist: asChecklist, checklist: asChecklist ? [{ id: uid(), text: '', done: false }] : [] })
    setEditing(useStore.getState().notes.find((x) => x.id === id)!)
    setOpen(true)
  }
  function openExisting(n: Note) { setEditing(n); setOpen(true) }
  function isEmpty(n: Note) {
    return !n.title.trim() && !n.body.trim() && !(n.checklist || []).some((c) => c.text.trim())
  }
  function close() {
    if (editing && isEmpty(editing)) deleteNote(editing.id)
    setOpen(false); setEditing(null); setLabelInput('')
  }
  function patch(p: Partial<Note>) {
    if (!editing) return
    const next = { ...editing, ...p }
    setEditing(next)
    updateNote(editing.id, p)
  }
  // checklist helpers
  function setItem(id: string, p: Partial<ChecklistItem>) {
    if (!editing) return
    patch({ checklist: editing.checklist.map((c) => (c.id === id ? { ...c, ...p } : c)) })
  }
  function addItem() {
    if (!editing) return
    patch({ checklist: [...editing.checklist, { id: uid(), text: '', done: false }] })
  }
  function removeItem(id: string) {
    if (!editing) return
    patch({ checklist: editing.checklist.filter((c) => c.id !== id) })
  }
  function addLabel() {
    if (!editing || !labelInput.trim()) return
    if (!editing.labels.includes(labelInput.trim())) patch({ labels: [...editing.labels, labelInput.trim()] })
    setLabelInput('')
  }

  const term = q.toLowerCase().trim()
  const visible = notes
    .filter((n) => n.archived === showArchived)
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
        return (
          <button
            key={n.id}
            onClick={() => openExisting(n)}
            className="block w-full break-inside-avoid rounded-3xl border border-line/60 p-4 text-left transition active:scale-[0.98] animate-fade-up"
            style={{ background: n.color ? `rgb(${n.color} / 0.16)` : 'rgb(var(--card))' }}
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
              n.body && <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted line-clamp-[12]">{n.body}</p>
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

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-card border border-line px-4 py-1">
        <Search size={18} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes, lists, labels…" className="flex-1 bg-transparent py-3 outline-none placeholder:text-muted" />
        {q && <button onClick={() => setQ('')}><X size={18} className="text-muted" /></button>}
      </div>

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

      {/* FAB cluster */}
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

      <Sheet open={open} onClose={close}>
        {editing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => patch({ pinned: !editing.pinned })} className={editing.pinned ? 'text-brand' : 'text-muted'}>
                  <Pin size={21} fill={editing.pinned ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => patch({ isChecklist: !editing.isChecklist })} className={editing.isChecklist ? 'text-brand' : 'text-muted'} title="Toggle checklist">
                  <ListChecks size={21} />
                </button>
                <button onClick={() => { patch({ archived: !editing.archived }); setOpen(false); setEditing(null) }} className="text-muted">
                  {editing.archived ? <ArchiveRestore size={21} /> : <Archive size={21} />}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { deleteNote(editing.id); setOpen(false); setEditing(null) }} className="text-rose-400"><Trash2 size={21} /></button>
                <button onClick={close} className="text-muted"><X size={21} /></button>
              </div>
            </div>

            <input placeholder="Title" value={editing.title} onChange={(e) => patch({ title: e.target.value })} className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-muted" />

            {editing.isChecklist ? (
              <div className="space-y-2">
                {editing.checklist.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <button onClick={() => setItem(c.id, { done: !c.done })}>
                      {c.done ? <CheckSquare size={20} className="text-brand" /> : <Square size={20} className="text-muted" />}
                    </button>
                    <input
                      value={c.text}
                      onChange={(e) => setItem(c.id, { text: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                      placeholder="List item"
                      className={`flex-1 bg-transparent py-1 outline-none ${c.done ? 'text-muted line-through' : ''}`}
                    />
                    <button onClick={() => removeItem(c.id)} className="text-muted"><X size={16} /></button>
                  </div>
                ))}
                <button onClick={addItem} className="flex items-center gap-2 py-1 text-sm font-medium text-brand"><Plus size={16} /> Add item</button>
              </div>
            ) : (
              <textarea placeholder="Take a note…" rows={7} value={editing.body} onChange={(e) => patch({ body: e.target.value })} className="w-full resize-none bg-transparent outline-none placeholder:text-muted" />
            )}

            {/* Labels */}
            <div className="flex flex-wrap items-center gap-2">
              {editing.labels.map((l) => (
                <span key={l} className="flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-medium text-brand">
                  {l}<button onClick={() => patch({ labels: editing.labels.filter((x) => x !== l) })}><X size={12} /></button>
                </span>
              ))}
              <div className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1">
                <Tag size={13} className="text-muted" />
                <input value={labelInput} onChange={(e) => setLabelInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLabel()} placeholder="label" className="w-16 bg-transparent text-xs outline-none" />
              </div>
              {allLabels.filter((l) => !editing.labels.includes(l)).slice(0, 3).map((l) => (
                <button key={l} onClick={() => patch({ labels: [...editing.labels, l] })} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">+ {l}</button>
              ))}
            </div>

            {/* Colors */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {COLORS.map((c) => (
                <button key={c || 'none'} onClick={() => patch({ color: c })} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 ${editing.color === c ? 'border-brand' : 'border-line'}`} style={{ background: c ? `rgb(${c} / 0.4)` : 'rgb(var(--surface))' }}>
                  {editing.color === c && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
