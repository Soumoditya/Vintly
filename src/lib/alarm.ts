// In-app alarm engine: when an "alarm" reminder is due while the app is open,
// it rings a looping tone + shows a full-screen alert (real-alarm feel).
// When the app is closed, the high-priority notification still fires with sound.
import { useStore } from './store'

let ctx: AudioContext | null = null
let timer: any = null
let ringingId: string | null = null
const fired = new Set<string>()
const listeners = new Set<(id: string | null) => void>()

export function onAlarmRing(cb: (id: string | null) => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
function emit() { listeners.forEach((l) => l(ringingId)) }

function beepLoop() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const c = ctx
    const tick = () => {
      if (!ringingId) return
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'sine'
      o.frequency.value = 880
      g.gain.setValueAtTime(0.0001, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.35)
      o.connect(g); g.connect(c.destination)
      o.start(); o.stop(c.currentTime + 0.4)
    }
    tick()
    timer = setInterval(tick, 700)
  } catch {
    /* audio not available */
  }
  try { navigator.vibrate?.([500, 300, 500, 300, 500]) } catch {}
}

export function ringAlarm(id: string) {
  if (ringingId) return
  ringingId = id
  emit()
  beepLoop()
}

export function stopAlarm() {
  ringingId = null
  if (timer) { clearInterval(timer); timer = null }
  emit()
}

// Returns the currently-ringing reminder's title (or null).
export function ringingTitle(): string | null {
  if (!ringingId) return null
  return useStore.getState().reminders.find((r) => r.id === ringingId)?.title || 'Alarm'
}

// Starts a watcher (call once on app load) that triggers alarms when due.
export function startAlarmWatcher() {
  const check = () => {
    if (ringingId) return
    const now = Date.now()
    const due = useStore
      .getState()
      .reminders.find((r: any) => r.alarm && !r.done && !fired.has(r.id) && r.at <= now && now - r.at < 120000)
    if (due) { fired.add(due.id); ringAlarm(due.id) }
  }
  setInterval(check, 5000)
  check()
}

export function clearFired(id: string) { fired.delete(id) }
