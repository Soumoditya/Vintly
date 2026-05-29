import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Palette, Bell, User, Image, Check, Database } from 'lucide-react'
import { useStore } from '../lib/store'
import { ACCENTS, hexToRgbTriple, type ThemeName } from '../lib/theme'
import { firebaseReady } from '../lib/firebase'
import { Card, Button, Input } from '../components/ui'
import { notifyNow, ensureNotificationPermission } from '../lib/notifications'

const THEMES: { id: ThemeName; label: string; swatch: string }[] = [
  { id: 'midnight', label: 'Midnight', swatch: '#0b0f1a' },
  { id: 'ocean', label: 'Ocean', swatch: '#08121c' },
  { id: 'mocha', label: 'Mocha', swatch: '#181210' },
  { id: 'light', label: 'Light', swatch: '#f5f7fb' },
]

const WALLPAPERS = [
  '',
  'linear-gradient(160deg,#0b0f1a,#1a1230)',
  'linear-gradient(160deg,#0f2027,#203a43)',
  'linear-gradient(160deg,#42275a,#734b6d)',
  'linear-gradient(160deg,#114357,#f29492)',
]

export default function Settings() {
  const { settings, setSettings } = useStore()
  const [hex, setHex] = useState('#7c5cff')

  return (
    <div className="safe-top px-4 pb-6">
      <div className="flex items-center gap-3 py-4">
        <Link to="/" className="grid h-10 w-10 place-items-center rounded-2xl bg-card border border-line"><ArrowLeft size={18} /></Link>
        <h1 className="text-2xl font-extrabold">Settings</h1>
      </div>

      <Link to="/profile">
        <Card className="mb-3 flex items-center gap-3"><User className="text-brand" /><span className="flex-1 font-semibold">Edit profile</span><ArrowLeft className="rotate-180 text-muted" size={18} /></Card>
      </Link>

      {/* Theme */}
      <h2 className="mb-2 flex items-center gap-2 font-bold"><Palette size={18} /> Theme</h2>
      <Card className="mb-3">
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((t) => (
            <button key={t.id} onClick={() => setSettings({ theme: t.id })} className={`flex flex-col items-center gap-1 rounded-2xl p-2 ${settings.theme === t.id ? 'ring-2 ring-brand' : ''}`}>
              <span className="h-10 w-10 rounded-2xl border border-line" style={{ background: t.swatch }} />
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Accent */}
      <h2 className="mb-2 font-bold">Accent color</h2>
      <Card className="mb-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <button key={a.value} onClick={() => setSettings({ accent: a.value })} className={`grid h-10 w-10 place-items-center rounded-2xl ${settings.accent === a.value ? 'ring-2 ring-offset-2 ring-offset-card ring-white/60' : ''}`} style={{ background: `rgb(${a.value})` }}>
              {settings.accent === a.value && <Check size={16} className="text-white" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-10 w-12 rounded-xl bg-transparent" />
          <Input value={hex} onChange={(e) => setHex(e.target.value)} className="flex-1" />
          <Button variant="soft" onClick={() => { const t = hexToRgbTriple(hex); if (t) setSettings({ accent: t }) }}>Apply</Button>
        </div>
      </Card>

      {/* Chat wallpaper */}
      <h2 className="mb-2 flex items-center gap-2 font-bold"><Image size={18} /> Chat wallpaper</h2>
      <Card className="mb-3">
        <div className="flex gap-2 overflow-x-auto">
          {WALLPAPERS.map((w, i) => (
            <button key={i} onClick={() => setSettings({ chatWallpaper: w })} className={`h-16 w-12 shrink-0 rounded-2xl border border-line ${settings.chatWallpaper === w ? 'ring-2 ring-brand' : ''}`} style={{ background: w || 'rgb(var(--surface))' }} />
          ))}
        </div>
      </Card>

      {/* Step goal */}
      <h2 className="mb-2 font-bold">Daily step goal</h2>
      <Card className="mb-3 flex items-center gap-3">
        <input type="range" min={2000} max={20000} step={500} value={settings.stepGoal} onChange={(e) => setSettings({ stepGoal: Number(e.target.value) })} className="flex-1 accent-[rgb(var(--brand))]" />
        <span className="w-16 text-right font-semibold">{settings.stepGoal.toLocaleString()}</span>
      </Card>

      {/* Notifications */}
      <h2 className="mb-2 flex items-center gap-2 font-bold"><Bell size={18} /> Notifications</h2>
      <Card className="mb-3">
        <Button variant="ghost" className="w-full" onClick={async () => { await ensureNotificationPermission(); notifyNow('Vintly 👋', 'Notifications are working!') }}>Send a test notification</Button>
      </Card>

      {/* Account / backend status */}
      <h2 className="mb-2 flex items-center gap-2 font-bold"><Database size={18} /> Connect account (chat & sync)</h2>
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${firebaseReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-sm font-semibold">{firebaseReady ? 'Connected to Firebase' : 'Not connected (offline mode)'}</span>
        </div>
        {firebaseReady ? (
          <Link to="/auth"><Button variant="soft" className="w-full">Sign in / Create account</Button></Link>
        ) : (
          <p className="text-sm text-muted">
            Tasks, notes, calendar & streaks work offline right now. To enable accounts, chat, GIFs, media & voice:
            open <span className="font-semibold text-ink">src/lib/firebaseConfig.ts</span> and paste your free Firebase keys
            (full step-by-step is written in that file). Then the next APK build will have chat enabled.
          </p>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-muted">Vintly · v0.1 · made with ♥</p>
    </div>
  )
}
