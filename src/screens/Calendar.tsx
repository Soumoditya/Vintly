import { useRef, useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths,
  isSameMonth, isSameDay, format,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, PartyPopper, Landmark } from 'lucide-react'
import { useStore } from '../lib/store'
import { Sheet, Input, Button } from '../components/ui'
import { scheduleReminder, ensureNotificationPermission } from '../lib/notifications'
import { holidaysOn } from '../lib/holidays'

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
  const [dir, setDir] = useState<'next' | 'prev'>('next')
  const swipe = useRef<{ x: number; y: number } | null>(null)

  function changeMonth(delta: number) {
    setDir(delta > 0 ? 'next' : 'prev')
    setCursor((c) => addMonths(c, delta))
  }
  function onTouchStart(e: React.TouchEvent) { swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  function onTouchEnd(e: React.TouchEvent) {
    if (!swipe.current) return
    const dx = e.changedTouches[0].clientX - swipe.current.x
    const dy = e.changedTouches[0].clientY - swipe.current.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) changeMonth(dx < 0 ? 1 : -1)
    swipe.current = null
  }

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
      await ensureNotificationPermission()
      // Remind 10 min before — or right at start time if the event is very soon.
      const remindAt = dt.getTime() - 10 * 60000 > Date.now() ? new Date(dt.getTime() - 10 * 60000) : dt
      await scheduleReminder({
        title: `📅 ${title.trim()}`,
        body: `Starts at ${format(dt, 'p')}`,
        at: remindAt,
      })
    }
    setTitle('')
    setOpen(false)
  }

  return (
    <div className="safe-top px-5 pb-6">
      <div className="flex items-center justify-between pt-5 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">{format(cursor, 'MMMM yyyy')}</h1>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(-1)} className="grid h-10 w-10 place-items-center rounded-2xl bg-card border border-line"><ChevronLeft size={18} /></button>
          <button onClick={() => changeMonth(1)} className="grid h-10 w-10 place-items-center rounded-2xl bg-card border border-line"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div
        key={format(cursor, 'yyyy-MM')}
        className={`rounded-3xl ${dir === 'next' ? 'page-next' : 'page-prev'}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const has = events.some((e) => isSameDay(new Date(e.date), d))
          const hol = holidaysOn(d)
          const isSel = isSameDay(d, selected)
          const isToday = isSameDay(d, new Date())
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={`relative aspect-square rounded-2xl text-sm transition ${
                isSel ? 'bg-brand text-white font-bold' : isToday ? 'bg-brand/15 text-brand' : hol.length && isSameMonth(d, cursor) ? 'text-amber-400 font-semibold' : isSameMonth(d, cursor) ? 'text-ink' : 'text-muted/40'
              }`}
            >
              {format(d, 'd')}
              {!isSel && (has || hol.length > 0) && (
                <span className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {has && <span className="h-1 w-1 rounded-full bg-brand" />}
                  {hol.length > 0 && <span className="h-1 w-1 rounded-full bg-amber-400" />}
                </span>
              )}
            </button>
          )
        })}
        </div>
      </div>

      <div className="mt-5 mb-2 flex items-center justify-between">
        <h2 className="font-bold">{format(selected, 'EEE, MMM d')}</h2>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-sm font-semibold text-brand"><Plus size={16} /> Event</button>
      </div>

      <div className="space-y-2">
        {holidaysOn(selected).map((h, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl2 border border-amber-400/30 bg-amber-400/10 p-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/20 text-amber-400">
              {h.type === 'national' ? <Landmark size={17} /> : <PartyPopper size={17} />}
            </span>
            <div className="flex-1">
              <p className="font-medium">{h.name}</p>
              <p className="text-xs text-muted">{h.type === 'national' ? 'Public holiday' : 'Festival'}</p>
            </div>
          </div>
        ))}
        {dayEvents.length === 0 && holidaysOn(selected).length === 0 && <p className="py-6 text-center text-sm text-muted">No events. Add one to plan your day.</p>}
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
