// Local notifications + alarms via Capacitor, with a graceful web fallback.
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()
let channelReady = false

async function ensureChannel() {
  if (!isNative || channelReady) return
  try {
    await LocalNotifications.createChannel({
      id: 'vintly_reminders',
      name: 'Reminders & alarms',
      description: 'Task, event and alarm reminders',
      importance: 5, // HIGH — heads-up + sound
      visibility: 1,
      vibration: true,
    })
    channelReady = true
  } catch {
    /* ignore */
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    if (isNative) {
      let perm = await LocalNotifications.checkPermissions()
      if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions()
      await ensureChannel()
      return perm.display === 'granted'
    }
    if ('Notification' in window) {
      const p = await Notification.requestPermission()
      return p === 'granted'
    }
  } catch {
    /* ignore */
  }
  return false
}

let webIdCounter = 1

// Schedule a reminder/alarm at a specific time (optionally repeating).
export async function scheduleReminder(opts: {
  id?: number
  title: string
  body: string
  at: Date
  repeat?: 'none' | 'daily' | 'weekly'
}): Promise<number> {
  const id = opts.id ?? Math.floor(Math.random() * 2_000_000_000)
  if (isNative) {
    await ensureNotificationPermission()
    const every = opts.repeat === 'daily' ? 'day' : opts.repeat === 'weekly' ? 'week' : undefined
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: opts.title,
          body: opts.body,
          channelId: 'vintly_reminders',
          smallIcon: 'ic_stat_icon',
          schedule: { at: opts.at, allowWhileIdle: true, ...(every ? { every } : {}) },
        },
      ],
    })
    return id
  }
  // Web fallback: setTimeout while the app is open.
  const delay = opts.at.getTime() - Date.now()
  if (delay > 0 && 'Notification' in window) {
    const handle = window.setTimeout(() => {
      try {
        new Notification(opts.title, { body: opts.body })
      } catch {
        /* ignore */
      }
    }, Math.min(delay, 2_147_000_000))
    return handle || webIdCounter++
  }
  return webIdCounter++
}

export async function cancelReminder(id: number) {
  try {
    if (isNative) {
      await LocalNotifications.cancel({ notifications: [{ id }] })
    } else {
      window.clearTimeout(id)
    }
  } catch {
    /* ignore */
  }
}

// Immediate motivational nudge (used by streak / engagement system).
export async function notifyNow(title: string, body: string) {
  if (isNative) {
    await ensureNotificationPermission()
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 1_000_000),
          title,
          body,
          channelId: 'vintly_reminders',
          schedule: { at: new Date(Date.now() + 400) },
        },
      ],
    })
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}
