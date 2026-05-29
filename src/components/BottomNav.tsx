import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, StickyNote, Calendar, MessageCircle } from 'lucide-react'

const items = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/notes', icon: StickyNote, label: 'Notes' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
      <div className="mx-auto max-w-md px-3 pb-2">
        <div className="glass flex items-center justify-around rounded-3xl border border-line/70 px-2 py-2 shadow-soft">
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-medium transition ${
                  isActive ? 'text-brand' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-2xl transition ${
                      isActive ? 'bg-brand/15' : ''
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.6 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
