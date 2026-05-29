import { Link } from 'react-router-dom'
import {
  Flame, Trophy, Footprints, Bell, Settings as Cog, CheckCircle2, Plus,
  AlarmClock, StickyNote, Dumbbell, User,
} from 'lucide-react'
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

  const quick = [
    { to: '/reminders', icon: AlarmClock, label: 'Reminders', tint: '245 158 11' },
    { to: '/notes', icon: StickyNote, label: 'Notes', tint: '16 185 129' },
    { to: '/fitness', icon: Dumbbell, label: 'Fitness', tint: '244 63 94' },
    { to: '/profile', icon: User, label: 'Profile', tint: '14 165 233' },
  ]

  return (
    <div className="safe-top px-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-6">
        <div>
          <p className="text-sm font-medium text-muted">{greet},</p>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight">{profile.displayName} {profile.avatar}</h1>
        </div>
        <Link to="/settings" className="grid h-12 w-12 place-items-center rounded-2xl bg-card border border-line">
          <Cog size={21} />
        </Link>
      </div>

      {/* Streak + Points hero */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/25 to-transparent p-5">
          <Flame className="text-orange-400" size={26} />
          <p className="mt-3 text-4xl font-extrabold leading-none">{engagement.streak}</p>
          <p className="mt-1.5 text-sm text-muted">day streak 🔥</p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-400/20 to-transparent p-5">
          <Trophy className="text-amber-400" size={26} />
          <p className="mt-3 text-4xl font-extrabold leading-none">{engagement.points}</p>
          <p className="mt-1.5 text-sm text-muted">points earned</p>
        </Card>
      </div>

      {/* Steps ring */}
      <Link to="/fitness">
        <Card className="mt-4 flex items-center gap-5 p-5">
          <div className="relative grid h-20 w-20 place-items-center">
            <svg className="h-20 w-20 -rotate-90">
              <circle cx="40" cy="40" r="32" className="fill-none stroke-line" strokeWidth="7" />
              <circle cx="40" cy="40" r="32" className="fill-none stroke-brand" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 32} strokeDashoffset={2 * Math.PI * 32 * (1 - stepPct / 100)} />
            </svg>
            <Footprints className="absolute text-brand" size={22} />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">{steps.count.toLocaleString()} <span className="text-sm font-normal text-muted">steps</span></p>
            <p className="text-sm text-muted">{stepPct}% of {settings.stepGoal.toLocaleString()} goal</p>
          </div>
        </Card>
      </Link>

      {/* Quick actions */}
      <div className="mt-5 grid grid-cols-4 gap-3">
        {quick.map(({ to, icon: Icon, label, tint }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-2">
            <span className="grid w-full place-items-center rounded-3xl border border-line py-4" style={{ background: `rgb(${tint} / 0.12)` }}>
              <Icon size={22} style={{ color: `rgb(${tint})` }} />
            </span>
            <span className="text-xs font-medium text-muted">{label}</span>
          </Link>
        ))}
      </div>

      {/* Today */}
      <div className="mb-3 mt-7 flex items-center justify-between">
        <h2 className="text-xl font-bold">Today</h2>
        <Link to="/tasks" className="text-sm font-semibold text-brand">View all</Link>
      </div>
      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted">
          <CheckCircle2 size={16} className="text-brand" />
          {doneToday} done · {todayTasks.length} to go
        </div>
        <div className="mt-4 space-y-2.5">
          {todayTasks.slice(0, 4).map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
              <span className={`h-2.5 w-2.5 rounded-full ${t.priority === 'high' ? 'bg-rose-400' : t.priority === 'med' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="flex-1 truncate text-sm">{t.title}</span>
              <span className="text-xs font-semibold text-muted">+{t.points}</span>
            </div>
          ))}
          {todayTasks.length === 0 && (
            <p className="py-3 text-center text-sm text-muted">All clear. Add something to crush today ✨</p>
          )}
        </div>
        <Link to="/tasks" className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-brand/15 py-3 text-sm font-semibold text-brand">
          <Plus size={16} /> Add task
        </Link>
      </Card>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <h2 className="mb-3 mt-7 text-xl font-bold">Upcoming</h2>
          <div className="space-y-2.5">
            {upcoming.map((e) => (
              <Card key={e.id} className="flex items-center gap-3 p-4">
                <Bell size={17} style={{ color: `rgb(${e.color})` }} />
                <span className="flex-1 truncate font-medium">{e.title}</span>
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
