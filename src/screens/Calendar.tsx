import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths,
  isSameMonth, isSameDay, format,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock } from 'lucide-react'
import { useStore } from '../lib/store'
import { Sheet, Input, Button } from '../components/ui'
import { scheduleReminder } from '../lib/notifications'

const EVENT_COLORS = ['124 92 255', '16 185 129', '244 63 94', '245 158 11', '14 165 233']

export default function CalendarScreen() {
  const { events, addEvent, deleteEvent } = useStore()
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState(new Date())
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [color, setColor] = useState(EVENT_COLORS[0])
  const [remind, setRemind] = useState(true)

  const monthStart = startOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
  const days: Date[] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d)

  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.date), selected))
    .sort((a, b) => a.date - b.date)

  async function save() {
    if (!title.trim()) return
    const [h, m] = time.split(':').map(Number)
    const dt = new Date(selected)
    dt.setHours(h, m, 0, 0)
    addEvent({ title: title.trim(), date: dt.getTime(), color, remindMinsBefore: remind ? 10 : undefined })
    if (remind) {
      await scheduleReminder({
        title: `Upcoming: ${title.trim()}`,
        body: `Starts at ${format(dt, 'p')}`,
        at: new Date(dt.getTime() - 10 * 60000),
      })
    }
    setTitle('')
    setOpen(false)
  }

  return (
    <div className="safe-top px-4 pb-6">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-extrabold">{format(cursor, 'MMMM yyyy')}</h1>
        <div className="flex gap-1">
          <button onClick={() => setCursor(addMonths(cursor, -1))} className="grid h-10 w-10 place-items-center rounded-2xl bg-card border border-line"><ChevronLeft size={18} /></button>
          <button onClick={() => setCursor(addMonths(cursor, 1))} className="grid h-10 w-10 place-items-center rounded-2xl bg-card border border-line"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const has = events.some((e) => isSameDay(new Date(e.date), d))
          const isSel = isSameDay(d, selected)
          const isToday = isSameDay(d, new Date())
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={`relative aspect-square rounded-2xl text-sm transition ${
                isSel ? 'bg-brand text-white font-bold' : isToday ? 'bg-brand/15 text-brand' : isSameMonth(d, cursor) ? 'text-ink' : 'text-muted/40'
              }`}
            >
              {format(d, 'd')}
              {has && !isSel && <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />}
            </button>
          )
        })}
      </div>

      <div className="mt-5 mb-2 flex items-center justify-between">
        <h2 className="font-bold">{format(selected, 'EEE, MMM d')}</h2>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-sm font-semibold text-brand"><Plus size={16} /> Event</button>
      </div>

      <div className="space-y-2">
        {dayEvents.length === 0 && <p className="py-6 text-center text-sm text-muted">No events. Add one to plan your day.</p>}
        {dayEvents.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-xl2 bg-card border border-line/60 p-3 animate-fade-up">
            <span className="h-10 w-1.5 rounded-full" style={{ background: `rgb(${e.color})` }} />
            <div className="flex-1">
              <p className="font-medium">{e.title}</p>
              <p className="flex items-center gap-1 text-xs text-muted"><Clock size={12} /> {format(new Date(e.date), 'p')}</p>
            </div>
            <button onClick={() => deleteEvent(e.id)} className="text-muted"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={`New event · ${format(selected, 'MMM d')}`}>
        <div className="space-y-3">
          <Input autoFocus placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-muted" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-2xl bg-surface border border-line px-4 py-3 text-ink" />
          </div>
          <div className="flex gap-2">
            {EVENT_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-ink' : 'border-transparent'}`} style={{ background: `rgb(${c})` }} />
            ))}
          </div>
          <label className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
            <span className="text-sm">Remind me 10 min before</span>
            <input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--brand))]" />
          </label>
          <Button onClick={save} className="w-full">Add event</Button>
        </div>
      </Sheet>
    </div>
  )
}
