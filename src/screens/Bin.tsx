import { Link } from 'react-router-dom'
import { ArrowLeft, Trash2, RotateCcw, Trash } from 'lucide-react'
import { useStore } from '../lib/store'
import { Card, Button, EmptyState } from '../components/ui'
import { fontClass } from './NoteEditor'

export default function Bin() {
  const { notes, restoreNote, deleteNote } = useStore()
  const trashed = notes.filter((n) => n.trashed).sort((a, b) => (b.trashedAt || 0) - (a.trashedAt || 0))

  function emptyBin() {
    if (!confirm('Permanently delete all notes in the bin? This cannot be undone.')) return
    trashed.forEach((n) => deleteNote(n.id))
  }

  return (
    <div className="safe-top px-5 pb-6">
      <div className="flex items-center gap-3 pt-5 pb-4">
        <Link to="/notes" className="grid h-11 w-11 place-items-center rounded-2xl bg-card border border-line"><ArrowLeft size={18} /></Link>
        <h1 className="flex-1 text-3xl font-extrabold tracking-tight">Bin</h1>
        {trashed.length > 0 && <button onClick={emptyBin} className="text-sm font-semibold text-rose-400">Empty bin</button>}
      </div>

      {trashed.length === 0 ? (
        <EmptyState icon={<Trash />} title="Bin is empty" hint="Deleted notes appear here so you can restore them." />
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">Notes here can be restored, or deleted forever.</p>
          <div className="space-y-2">
            {trashed.map((n) => (
              <Card key={n.id} className={`${fontClass(n.font)}`}>
                {n.title && <p className="font-semibold">{n.title}</p>}
                {n.isChecklist
                  ? <p className="text-sm text-muted">{n.checklist.length} list items</p>
                  : n.body && <div className="line-clamp-2 text-sm text-muted" dangerouslySetInnerHTML={{ __html: n.body }} />}
                <div className="mt-3 flex gap-2">
                  <Button variant="soft" className="flex-1 !py-2" onClick={() => restoreNote(n.id)}><RotateCcw size={15} /> Restore</Button>
                  <Button variant="danger" className="flex-1 !py-2" onClick={() => deleteNote(n.id)}><Trash2 size={15} /> Delete forever</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
