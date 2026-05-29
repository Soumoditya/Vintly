import { useState } from 'react'
import { Plus, Check, Trash2, Flag } from 'lucide-react'
import { useStore, type Task } from '../lib/store'
import { Button, Card, Sheet, Input, Textarea, EmptyState } from '../components/ui'
import { notifyNow } from '../lib/notifications'

const prioColors = { high: 'bg-rose-400', med: 'bg-amber-400', low: 'bg-emerald-400' } as const

export default function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask } = useStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('med')
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('active')

  const filtered = tasks.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? !t.done : t.done,
  )

  function save() {
    if (!title.trim()) return
    addTask({ title: title.trim(), notes, priority })
    setTitle('')
    setNotes('')
    setPriority('med')
    setOpen(false)
  }

  function complete(t: Task) {
    if (!t.done) {
      const { engagement } = useStore.getState()
      notifyNow('Nice work! 🎉', `+${t.points} points · ${engagement.streak + (engagement.lastActiveDay === new Date().toISOString().slice(0,10) ? 0 : 1)} day streak`)
    }
    toggleTask(t.id)
  }

  return (
    <div className="safe-top px-4 pb-6">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-extrabold">Tasks</h1>
        <Button onClick={() => setOpen(true)} className="!px-4 !py-2.5">
          <Plus size={18} /> New
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        {(['active', 'all', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
              filter === f ? 'bg-brand text-white' : 'bg-card text-muted border border-line'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Check />} title="Nothing here yet" hint="Tap New to add a task and earn points." />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Card key={t.id} className="flex items-center gap-3 py-3 animate-fade-up">
              <button
                onClick={() => complete(t)}
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition ${
                  t.done ? 'border-brand bg-brand text-white' : 'border-line'
                }`}
              >
                {t.done && <Check size={16} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-medium ${t.done ? 'text-muted line-through' : ''}`}>{t.title}</p>
                {t.notes && <p className="truncate text-xs text-muted">{t.notes}</p>}
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${prioColors[t.priority]}`} />
              <span className="text-xs font-semibold text-muted">+{t.points}</span>
              <button onClick={() => deleteTask(t.id)} className="text-muted">
                <Trash2 size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New task">
        <div className="space-y-3">
          <Input autoFocus placeholder="What needs doing?" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Notes (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-muted" />
            {(['low', 'med', 'high'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold capitalize transition ${
                  priority === p ? 'bg-brand/20 text-brand' : 'bg-surface text-muted'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${prioColors[p]}`} /> {p}
              </button>
            ))}
          </div>
          <Button onClick={save} className="w-full">Add task</Button>
        </div>
      </Sheet>
    </div>
  )
}
