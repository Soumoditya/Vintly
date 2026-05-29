import { useEffect, useState } from 'react'
import { AlarmClock, BellOff, Clock } from 'lucide-react'
import { onAlarmRing, stopAlarm, ringingTitle } from '../lib/alarm'
import { useStore } from '../lib/store'
import { scheduleReminder } from '../lib/notifications'

// Full-screen "ringing" alarm shown when an alarm reminder is due (app open).
export default function AlarmRing() {
  const [id, setId] = useState<string | null>(null)
  const { reminders, addReminder } = useStore()

  useEffect(() => onAlarmRing(setId), [])
  if (!id) return null
  const title = ringingTitle()

  function dismiss() {
    useStore.setState((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, done: true } : r)) }))
    stopAlarm()
  }
  async function snooze() {
    const at = Date.now() + 5 * 60000
    const r = reminders.find((x) => x.id === id)
    const newId = Math.random().toString(36).slice(2)
    const notifId = await scheduleReminder({ title: '⏰ ' + (r?.title || 'Alarm'), body: 'Snoozed reminder', at: new Date(at) })
    addReminder({ id: newId, title: r?.title || 'Alarm', at, notifId, repeat: 'none', done: false, alarm: true })
    stopAlarm()
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-brand/40 to-surface px-8 text-center">
      <div className="grid h-28 w-28 animate-pulse place-items-center rounded-full bg-brand/30 text-brand">
        <AlarmClock size={56} />
      </div>
      <p className="mt-6 text-sm uppercase tracking-widest text-muted">Alarm</p>
      <h1 className="mt-1 text-3xl font-extrabold">{title}</h1>
      <p className="mt-2 text-muted">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>

      <div className="mt-12 flex w-full max-w-xs flex-col gap-3">
        <button onClick={dismiss} className="flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-bold text-white shadow-glow">
          <BellOff size={20} /> Dismiss
        </button>
        <button onClick={snooze} className="flex items-center justify-center gap-2 rounded-2xl bg-card border border-line py-4 font-semibold">
          <Clock size={20} /> Snooze 5 min
        </button>
      </div>
    </div>
  )
}
