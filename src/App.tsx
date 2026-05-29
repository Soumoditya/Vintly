import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import BottomNav from './components/BottomNav'
import Home from './screens/Home'
import Tasks from './screens/Tasks'
import Notes from './screens/Notes'
import NoteEditor from './screens/NoteEditor'
import Bin from './screens/Bin'
import CalendarScreen from './screens/Calendar'
import ChatList from './screens/ChatList'
import ChatRoom from './screens/ChatRoom'
import Fitness from './screens/Fitness'
import Reminders from './screens/Reminders'
import Games from './screens/Games'
import Weather from './screens/Weather'
import QuickMath from './games/QuickMath'
import MemoryMatch from './games/MemoryMatch'
import Snake from './games/Snake'
import CarRace from './games/CarRace'
import Profile from './screens/Profile'
import Settings from './screens/Settings'
import Auth from './screens/Auth'
import { ensureNotificationPermission } from './lib/notifications'
import { syncEngagementNudges } from './lib/engagement'
import { startAlarmWatcher } from './lib/alarm'
import AlarmRing from './components/AlarmRing'
import { useStore } from './lib/store'

export default function App() {
  const loc = useLocation()
  const hideNav = loc.pathname.startsWith('/chat/') || loc.pathname.startsWith('/note/') || loc.pathname.startsWith('/games/') || loc.pathname === '/auth'

  useEffect(() => {
    ensureNotificationPermission().then(() => {
      // (Re)schedule daily motivational nudges + streak reminders.
      syncEngagementNudges(useStore.getState().settings)
    })
    startAlarmWatcher()
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/status-bar')
        .then(({ StatusBar, Style }) => StatusBar.setStyle({ style: Style.Dark }))
        .catch(() => {})
    }
  }, [])

  return (
    <div className="mx-auto min-h-full max-w-md">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/note/:id" element={<NoteEditor />} />
        <Route path="/bin" element={<Bin />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:cid" element={<ChatRoom />} />
        <Route path="/fitness" element={<Fitness />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/games" element={<Games />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/games/math" element={<QuickMath />} />
        <Route path="/games/memory" element={<MemoryMatch />} />
        <Route path="/games/snake" element={<Snake />} />
        <Route path="/games/car" element={<CarRace />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
      {!hideNav && <div className="h-24" />}
      {!hideNav && <BottomNav />}
      <AlarmRing />
    </div>
  )
}
