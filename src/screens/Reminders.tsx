import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Bell, AlarmClock, Repeat, Zap } from 'lucide-react'
import { ringAlarm } from '../lib/alarm'
import { useStore } from '../lib/store'
import { Card, Button, Sheet, Input } from '../components/ui'
import { scheduleReminder, cancelReminder, ensureNotificationPermission, notifyNow } from '../lib/notifications'

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export default function Reminders() {
  const { reminders, addReminder, removeReminder } = useStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const today = new Date()
  const [date, setDate] = useState(today.toISOString().slice(0, 10))
  const [time, setTime] = useState(new Date(Date.now() + 5 * 60000).toTimeString().slice(0, 5))
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none')
  const [alarm, setAlarm] = useState(true)

  const upcoming = [...reminders].sort((a, b) => a.at - b.at)

  async function save() {
    if (!title.trim()) return
    const at = new Date(`${date}T${time}`)
    const prefix = alarm ? '⏰ ' : '🔔 '
    const notifId = await scheduleReminder({ title: prefix + title.trim(), body: alarm ? 'Alarm' : 'Reminder from Vintly', at, repeat })
    addReminder({ id: uid(), title: title.trim(), at: at.getTime(), notifId, repeat, done: false, alarm })
    setTitle('')
    setOpen(false)
  }

  async function remove(id: string, notifId?: number) {
    if (notifId != null) await cancelReminder(notifId)
    removeReminder(id)
  }

  async function testNow() {
    const ok = await ensureNotificationPermission()
    if (!ok) { alert('Please allow notifications for Vintly in your phone settings.'); return }
    await scheduleReminder({ title: '⏰ Test reminder', body: 'This fires ~10 seconds from now.', at: new Date(Date.now() + 10000) })
    alert('Scheduled! Lock your phone — it should buzz in ~10 seconds.')
  }

  return (
    <div className="safe-top px-5 pb-6">
      <div className="flex items-center gap-3 pt-5 pb-4">
        <Link to="/" className="grid h-11 w-11 place-items-center rounded-2xl bg-card border border-line"><ArrowLeft size={18} /></Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Reminders</h1>
      </div>

      <Card className="mb-4 bg-gradient-to-br from-brand/20 to-transparent">
        <div className="flex items-center gap-3">
          <Zap className="text-amber-400" />
          <div className="flex-1">
            <p className="font-semibold">Test it out</p>
            <p className="text-sm text-muted">Check notifications & the alarm ringer.</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={testNow}>Notify (10s)</Button>
          <Button variant="soft" className="flex-1" onClick={() => ringAlarm('test')}>Ring alarm now</Button>
        </div>
      </Card>

      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-brand/10 text-brand"><AlarmClock /></div>
          <p className="font-semibold">No reminders yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted">Set alarms for anything — they fire even when the app is closed.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((r) => {
            const past = r.at < Date.now() && r.repeat === 'none'
            return (
              <Card key={r.id} className="flex items-center gap-3.5 py-3.5">
                <div className={`grid h-11 w-11 place-items-center rounded-2xl ${past ? 'bg-line text-muted' : 'bg-brand/15 text-brand'}`}><Bell size={19} /></div>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${past ? 'text-muted line-through' : ''}`}>{r.title}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    {new Date(r.at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {r.repeat !== 'none' && <span className="flex items-center gap-0.5 text-brand"><Repeat size={12} /> {r.repeat}</span>}
                  </p>
                </div>
                <button onClick={() => remove(r.id, r.notifId)} className="text-muted"><Trash2 size={18} /></button>
              </Card>
            )
          })}
        </div>
      )}

      <button onClick={() => setOpen(true)} className="fixed bottom-28 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-brand px-7 py-4 font-semibold text-white shadow-glow">
        <Plus size={20} /> New reminder
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="New reminder">
        <div className="space-y-3">
          <Input autoFocus placeholder="Remind me to…" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 rounded-2xl bg-surface border border-line px-4 py-3 text-ink" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-2xl bg-surface border border-line px-4 py-3 text-ink" />
          </div>
          <div className="flex items-center gap-2">
            <Repeat size={16} className="text-muted" />
            {(['none', 'daily', 'weekly'] as const).map((r) => (
              <button key={r} onClick={() => setRepeat(r)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize ${repeat === r ? 'bg-brand/20 text-brand' : 'bg-surface text-muted'}`}>{r}</button>
            ))}
          </div>
          <label className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-medium"><AlarmClock size={16} className="text-brand" /> Ring as alarm</span>
            <input type="checkbox" checked={alarm} onChange={(e) => setAlarm(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--brand))]" />
          </label>
          <Button onClick={save} className="w-full">{alarm ? 'Set alarm' : 'Set reminder'}</Button>
        </div>
      </Sheet>
    </div>
  )
}
