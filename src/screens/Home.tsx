import { Link } from 'react-router-dom'
import { Flame, Trophy, Footprints, Bell, Settings as Cog, CheckCircle2, Plus, Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'
import { Card } from '../components/ui'

export default function Home() {
  const { profile, tasks, engagement, steps, settings, events } = useStore()
  const today = new Date()
  const hour = today.getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const todayTasks = tasks.filter((t) => !t.done)
  const doneToday = tasks.filter(
    (t) => t.done && t.completedAt && new Date(t.completedAt).toDateString() === today.toDateString(),
  ).length
  const stepPct = Math.min(100, Math.round((steps.count / settings.stepGoal) * 100))
  const upcoming = [...events]
    .filter((e) => e.date >= Date.now() - 3600000)
    .sort((a, b) => a.date - b.date)
    .slice(0, 2)

  return (
    <div className="safe-top px-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div>
          <p className="text-sm text-muted">{greet},</p>
          <h1 className="text-2xl font-extrabold">{profile.displayName} {profile.avatar}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/fitness" className="grid h-11 w-11 place-items-center rounded-2xl bg-card border border-line">
            <Footprints size={20} />
          </Link>
          <Link to="/settings" className="grid h-11 w-11 place-items-center rounded-2xl bg-card border border-line">
            <Cog size={20} />
          </Link>
        </div>
      </div>

      {/* Streak + Points hero */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-brand/25 to-brand/5">
          <Flame className="text-orange-400" />
          <p className="mt-2 text-3xl font-extrabold">{engagement.streak}</p>
          <p className="text-sm text-muted">day streak 🔥</p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-400/20 to-transparent">
          <Trophy className="text-amber-400" />
          <p className="mt-2 text-3xl font-extrabold">{engagement.points}</p>
          <p className="text-sm text-muted">points earned</p>
        </Card>
      </div>

      {/* Steps ring */}
      <Link to="/fitness">
        <Card className="mt-3 flex items-center gap-4">
          <div className="relative grid h-16 w-16 place-items-center">
            <svg className="h-16 w-16 -rotate-90">
              <circle cx="32" cy="32" r="26" className="fill-none stroke-line" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="26"
                className="fill-none stroke-brand"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - stepPct / 100)}
              />
            </svg>
            <Footprints className="absolute text-brand" size={18} />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{steps.count.toLocaleString()} steps</p>
            <p className="text-sm text-muted">{stepPct}% of {settings.stepGoal.toLocaleString()} goal</p>
          </div>
          <Sparkles className="text-muted" size={18} />
        </Card>
      </Link>

      {/* Today */}
      <div className="mt-5 mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">Today</h2>
        <Link to="/tasks" className="text-sm font-semibold text-brand">View all</Link>
      </div>
      <Card>
        <div className="flex items-center gap-2 text-sm text-muted">
          <CheckCircle2 size={16} className="text-brand" />
          {doneToday} done · {todayTasks.length} to go
        </div>
        <div className="mt-3 space-y-2">
          {todayTasks.slice(0, 3).map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${t.priority === 'high' ? 'bg-rose-400' : t.priority === 'med' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="flex-1 truncate text-sm">{t.title}</span>
              <span className="text-xs text-muted">+{t.points}</span>
            </div>
          ))}
          {todayTasks.length === 0 && (
            <p className="py-2 text-center text-sm text-muted">All clear. Add something to crush today ✨</p>
          )}
        </div>
        <Link to="/tasks" className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-brand/15 py-2.5 text-sm font-semibold text-brand">
          <Plus size={16} /> Add task
        </Link>
      </Card>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 text-lg font-bold">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.map((e) => (
              <Card key={e.id} className="flex items-center gap-3 py-3">
                <Bell size={16} style={{ color: `rgb(${e.color})` }} />
                <span className="flex-1 truncate text-sm font-medium">{e.title}</span>
                <span className="text-xs text-muted">
                  {new Date(e.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
