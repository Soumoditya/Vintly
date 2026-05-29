// Local notifications + alarms via Capacitor, with a graceful web fallback.
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    if (isNative) {
      const p = await LocalNotifications.requestPermissions()
      return p.display === 'granted'
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

// Schedule a reminder/alarm at a specific time.
export async function scheduleReminder(opts: {
  id?: number
  title: string
  body: string
  at: Date
}): Promise<number> {
  const id = opts.id ?? Math.floor(Date.now() % 2_000_000_000)
  if (isNative) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: opts.title,
          body: opts.body,
          schedule: { at: opts.at, allowWhileIdle: true },
          smallIcon: 'ic_stat_icon',
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
    await LocalNotifications.schedule({
      notifications: [
        { id: Math.floor(Math.random() * 1_000_000), title, body, schedule: { at: new Date(Date.now() + 500) } },
      ],
    })
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}
