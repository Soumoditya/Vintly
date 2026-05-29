import { useState } from 'react'
import { Plus, Pin, Trash2, X } from 'lucide-react'
import { useStore, type Note } from '../lib/store'
import { Sheet, Input, Textarea, EmptyState } from '../components/ui'
import { StickyNote } from 'lucide-react'

const COLORS = ['', '124 92 255', '16 185 129', '244 63 94', '245 158 11', '14 165 233']

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useStore()
  const [editing, setEditing] = useState<Note | null>(null)
  const [open, setOpen] = useState(false)

  function openNew() {
    const id = addNote({})
    const n = useStore.getState().notes.find((x) => x.id === id)!
    setEditing(n)
    setOpen(true)
  }
  function openExisting(n: Note) {
    setEditing(n)
    setOpen(true)
  }
  function close() {
    // discard empty notes
    if (editing && !editing.title.trim() && !editing.body.trim()) deleteNote(editing.id)
    setOpen(false)
    setEditing(null)
  }
  function patch(p: Partial<Note>) {
    if (!editing) return
    const next = { ...editing, ...p }
    setEditing(next)
    updateNote(editing.id, p)
  }

  const pinned = notes.filter((n) => n.pinned)
  const others = notes.filter((n) => !n.pinned)

  const grid = (list: Note[]) => (
    <div className="columns-2 gap-3 [&>*]:mb-3">
      {list.map((n) => (
        <button
          key={n.id}
          onClick={() => openExisting(n)}
          className="block w-full break-inside-avoid rounded-xl2 border border-line/60 p-3 text-left animate-fade-up"
          style={{ background: n.color ? `rgb(${n.color} / 0.18)` : 'rgb(var(--card))' }}
        >
          {n.pinned && <Pin size={13} className="mb-1 text-brand" fill="currentColor" />}
          {n.title && <p className="mb-1 font-semibold leading-tight">{n.title}</p>}
          {n.body && <p className="whitespace-pre-wrap text-sm text-muted line-clamp-[10]">{n.body}</p>}
        </button>
      ))}
    </div>
  )

  return (
    <div className="safe-top px-4 pb-6">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-extrabold">Notes</h1>
        <button onClick={openNew} className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white shadow-glow">
          <Plus size={22} />
        </button>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={<StickyNote />} title="Your notes live here" hint="Capture ideas, lists and reminders. Tap + to start." />
      ) : (
        <>
          {pinned.length > 0 && <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Pinned</p>}
          {pinned.length > 0 && grid(pinned)}
          {others.length > 0 && pinned.length > 0 && <p className="mb-2 mt-2 text-xs font-bold uppercase tracking-wide text-muted">Others</p>}
          {grid(others)}
        </>
      )}

      <Sheet open={open} onClose={close}>
        {editing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={() => patch({ pinned: !editing.pinned })} className={editing.pinned ? 'text-brand' : 'text-muted'}>
                <Pin size={20} fill={editing.pinned ? 'currentColor' : 'none'} />
              </button>
              <div className="flex gap-2">
                <button onClick={() => { deleteNote(editing.id); setOpen(false); setEditing(null) }} className="text-rose-400">
                  <Trash2 size={20} />
                </button>
                <button onClick={close} className="text-muted"><X size={20} /></button>
              </div>
            </div>
            <Input placeholder="Title" value={editing.title} onChange={(e) => patch({ title: e.target.value })} className="!border-0 !bg-transparent !px-0 text-lg font-bold" />
            <Textarea placeholder="Take a note…" rows={8} value={editing.body} onChange={(e) => patch({ body: e.target.value })} className="!border-0 !bg-transparent !px-0" />
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c || 'none'}
                  onClick={() => patch({ color: c })}
                  className={`h-8 w-8 rounded-full border-2 ${editing.color === c ? 'border-brand' : 'border-line'}`}
                  style={{ background: c ? `rgb(${c} / 0.4)` : 'rgb(var(--surface))' }}
                />
              ))}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
