// Zomato/Duolingo-style motivational nudges via daily-repeating local notifications.
// No server needed — these schedule on-device and fire even when the app is closed.
import { scheduleReminder, cancelReminder, ensureNotificationPermission } from './notifications'
import type { Settings } from './store'

// Stable IDs so re-scheduling replaces the previous one instead of stacking.
const ID_STREAK = 910001
const ID_MORNING = 910002

const STREAK_LINES = [
  "🔥 Don't break your streak! Finish a task in Vintly.",
  '🔥 Your streak is waiting — knock out one task tonight!',
  '⚡ A few taps keeps your streak alive. Open Vintly!',
  '🏆 Future you will thank you. Complete a task now!',
]
const MORNING_LINES = [
  '☀️ Good morning! Plan your day in Vintly.',
  '📝 What are your 3 wins for today? Add them now.',
  '✨ New day, fresh streak points. Let’s go!',
]
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)]

// Returns the next occurrence of HH:MM (today if still ahead, else tomorrow).
function nextAt(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h || 9, m || 0, 0, 0)
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1)
  return d
}

// Re-schedule all engagement nudges based on current settings.
export async function syncEngagementNudges(settings: Settings) {
  await ensureNotificationPermission()

  if (settings.streakReminder) {
    await scheduleReminder({
      id: ID_STREAK,
      title: 'Vintly',
      body: pick(STREAK_LINES),
      at: nextAt(settings.streakReminderTime),
      repeat: 'daily',
    })
  } else {
    await cancelReminder(ID_STREAK)
  }

  if (settings.morningNudge) {
    await scheduleReminder({
      id: ID_MORNING,
      title: 'Vintly',
      body: pick(MORNING_LINES),
      at: nextAt(settings.morningNudgeTime),
      repeat: 'daily',
    })
  } else {
    await cancelReminder(ID_MORNING)
  }
}
