// Zomato/Duolingo-style motivational nudges via daily-repeating local
// notifications (no server needed). Fires several times through the day so the
// app keeps pulling you back. Fire even when the app is closed.
import { scheduleReminder, cancelReminder, ensureNotificationPermission } from './notifications'
import type { Settings } from './store'

const BASE_ID = 910100
// Daytime hours to nudge at (every hour, 8am–10pm).
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]

const LINES = [
  '🔥 Keep your streak alive — finish one task!',
  '📝 Got a thought? Jot it in Vintly notes.',
  '🎮 Quick break? A round of Car Racing awaits.',
  '⚡ 2 minutes, 1 task. You’ve got this!',
  '🏆 You’re close to a new points record!',
  '🚶 How are your steps looking today?',
  '✨ Plan your evening — what’s the one win?',
  '🌙 Wind down: tick off today’s last task.',
  '💪 Consistency beats intensity. Open Vintly!',
  '📅 Anything on the calendar you’re forgetting?',
]
const MORNING = ['☀️ Good morning! Plan your day in Vintly.', '📝 3 wins for today — add them now.', '✨ Fresh day, fresh streak. Let’s go!']
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)]

function nextAt(hour: number, min = 0): Date {
  const d = new Date()
  d.setHours(hour, min, 0, 0)
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1)
  return d
}

export async function syncEngagementNudges(settings: Settings) {
  await ensureNotificationPermission()

  // Morning planner (own toggle + time)
  if (settings.morningNudge) {
    const [h, m] = settings.morningNudgeTime.split(':').map(Number)
    await scheduleReminder({ id: BASE_ID - 1, title: 'Vintly', body: pick(MORNING), at: nextAt(h || 9, m || 0), repeat: 'daily' })
  } else {
    await cancelReminder(BASE_ID - 1)
  }

  // Frequent daytime nudges (~every 2h) — controlled by the streak-reminder toggle.
  for (let i = 0; i < HOURS.length; i++) {
    const id = BASE_ID + i
    if (settings.streakReminder) {
      await scheduleReminder({ id, title: 'Vintly', body: pick(LINES), at: nextAt(HOURS[i]), repeat: 'daily' })
    } else {
      await cancelReminder(id)
    }
  }
}
