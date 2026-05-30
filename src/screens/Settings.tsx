import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Palette, Bell, User, Image, Check, Database, Upload, LogOut, Loader2, Download } from 'lucide-react'

const APP_VERSION = '0.3.0'
const APK_URL = 'https://github.com/Soumoditya/Vintly/releases/download/latest/Vintly.apk'
import { useStore } from '../lib/store'
import { ACCENTS, hexToRgbTriple, type ThemeName } from '../lib/theme'
import { firebaseReady } from '../lib/firebase'
import { useAuth, signOut } from '../lib/auth'
import { uploadToCloudinary, cloudinaryReady } from '../lib/cloudinary'
import { Card, Button, Input } from '../components/ui'
import { notifyNow, ensureNotificationPermission } from '../lib/notifications'
import { syncEngagementNudges } from '../lib/engagement'

const THEMES: { id: ThemeName; label: string; swatch: string }[] = [
  { id: 'midnight', label: 'Midnight', swatch: '#0b0f1a' },
  { id: 'ocean', label: 'Ocean', swatch: '#08121c' },
  { id: 'forest', label: 'Forest', swatch: '#0a1410' },
  { id: 'mocha', label: 'Mocha', swatch: '#181210' },
  { id: 'rose', label: 'Rose', swatch: '#1a0e12' },
  { id: 'grape', label: 'Grape', swatch: '#140e1e' },
  { id: 'slate', label: 'Slate', swatch: '#101216' },
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
  const { user } = useAuth()
  const nav = useNavigate()
  const [hex, setHex] = useState('#7c5cff')
  const [uploading, setUploading] = useState(false)
  const wpRef = useRef<HTMLInputElement>(null)

  async function uploadWallpaper(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!cloudinaryReady) { alert('Connect Cloudinary to upload custom wallpapers.'); return }
    setUploading(true)
    try {
      const url = await uploadToCloudinary(f, 'image')
      setSettings({ chatWallpaper: `center/cover no-repeat url(${url})` })
    } catch {
      alert('Upload failed, please try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="safe-top px-5 pb-6">
      <div className="flex items-center gap-3 pt-5 pb-4">
        <Link to="/" className="grid h-11 w-11 place-items-center rounded-2xl bg-card border border-line"><ArrowLeft size={18} /></Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
      </div>

      <Link to="/profile">
        <Card className="mb-3 flex items-center gap-3"><User className="text-brand" /><span className="flex-1 font-semibold">Edit profile</span><ArrowLeft className="rotate-180 text-muted" size={18} /></Card>
      </Link>

      {/* App updates */}
      <Card className="mb-3 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/15 text-brand"><Download size={18} /></div>
        <div className="flex-1">
          <p className="font-semibold">Update Vintly</p>
          <p className="text-xs text-muted">v{APP_VERSION} · get the newest build</p>
        </div>
        <a href={APK_URL} target="_blank" rel="noreferrer"><Button variant="soft">Download</Button></a>
      </Card>

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
        {/* Custom theme background */}
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <span className={`grid h-9 w-9 place-items-center rounded-2xl border-2 ${settings.theme === 'custom' ? 'border-brand' : 'border-line'}`} style={{ background: `rgb(${settings.customBg})` }}>
            {settings.theme === 'custom' && <Check size={14} />}
          </span>
          <span className="flex-1 text-sm">Custom background</span>
          <input type="color" value={'#' + settings.customBg.split(' ').map((n) => (+n).toString(16).padStart(2, '0')).join('')}
            onChange={(e) => { const t = hexToRgbTriple(e.target.value); if (t) setSettings({ customBg: t, theme: 'custom' }) }}
            className="h-9 w-12 rounded-xl bg-transparent" />
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
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSettings({ chatWallpaper: '' })} className={`grid h-20 w-14 shrink-0 place-items-center rounded-2xl border border-line text-muted ${settings.chatWallpaper === '' ? 'ring-2 ring-brand' : ''}`} style={{ background: 'rgb(var(--surface))' }}>
            <span className="text-[10px]">None</span>
          </button>
          {WALLPAPERS.slice(1).map((w, i) => (
            <button key={i} onClick={() => setSettings({ chatWallpaper: w })} className={`h-20 w-14 shrink-0 rounded-2xl border border-line ${settings.chatWallpaper === w ? 'ring-2 ring-brand' : ''}`} style={{ background: w }} />
          ))}
          {/* Current custom wallpaper preview, if any */}
          {settings.chatWallpaper.includes('url(') && (
            <div className="h-20 w-14 shrink-0 rounded-2xl border-2 border-brand" style={{ background: settings.chatWallpaper }} />
          )}
          <button onClick={() => wpRef.current?.click()} className="grid h-20 w-14 shrink-0 place-items-center rounded-2xl border border-dashed border-line text-muted">
            {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          </button>
          <input ref={wpRef} type="file" accept="image/*" className="hidden" onChange={uploadWallpaper} />
        </div>
        <p className="mt-2 text-xs text-muted">Tap the dashed box to upload your own photo as chat background.</p>
        {settings.chatWallpaper.includes('url(') && (
          <button onClick={() => setSettings({ chatWallpaper: '' })} className="mt-2 text-sm font-semibold text-rose-400">Remove custom wallpaper</button>
        )}
      </Card>

      {/* Step goal */}
      <h2 className="mb-2 font-bold">Daily step goal</h2>
      <Card className="mb-3 flex items-center gap-3">
        <input type="range" min={2000} max={20000} step={500} value={settings.stepGoal} onChange={(e) => setSettings({ stepGoal: Number(e.target.value) })} className="flex-1 accent-[rgb(var(--brand))]" />
        <span className="w-16 text-right font-semibold">{settings.stepGoal.toLocaleString()}</span>
      </Card>

      {/* Notifications & motivation */}
      <h2 className="mb-2 flex items-center gap-2 font-bold"><Bell size={18} /> Notifications & motivation</h2>
      <Card className="mb-3 space-y-3">
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-medium">🔥 Daily streak reminder</span>
            <span className="block text-xs text-muted">Nudges you to keep your streak alive</span>
          </span>
          <input type="checkbox" checked={settings.streakReminder} onChange={async (e) => { setSettings({ streakReminder: e.target.checked }); await syncEngagementNudges(useStore.getState().settings) }} className="h-5 w-5 accent-[rgb(var(--brand))]" />
        </label>
        {settings.streakReminder && (
          <div className="flex items-center justify-between pl-1">
            <span className="text-sm text-muted">Remind at</span>
            <input type="time" value={settings.streakReminderTime} onChange={async (e) => { setSettings({ streakReminderTime: e.target.value }); await syncEngagementNudges(useStore.getState().settings) }} className="rounded-xl bg-surface border border-line px-3 py-2 text-ink" />
          </div>
        )}
        <div className="h-px bg-line" />
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-medium">☀️ Morning planner nudge</span>
            <span className="block text-xs text-muted">Start your day with intention</span>
          </span>
          <input type="checkbox" checked={settings.morningNudge} onChange={async (e) => { setSettings({ morningNudge: e.target.checked }); await syncEngagementNudges(useStore.getState().settings) }} className="h-5 w-5 accent-[rgb(var(--brand))]" />
        </label>
        {settings.morningNudge && (
          <div className="flex items-center justify-between pl-1">
            <span className="text-sm text-muted">Nudge at</span>
            <input type="time" value={settings.morningNudgeTime} onChange={async (e) => { setSettings({ morningNudgeTime: e.target.value }); await syncEngagementNudges(useStore.getState().settings) }} className="rounded-xl bg-surface border border-line px-3 py-2 text-ink" />
          </div>
        )}
        <div className="h-px bg-line" />
        <Button variant="ghost" className="w-full" onClick={async () => { await ensureNotificationPermission(); notifyNow('Vintly 👋', 'Notifications are working!') }}>Send a test notification</Button>
      </Card>

      {/* Account / backend status */}
      <h2 className="mb-2 flex items-center gap-2 font-bold"><Database size={18} /> Account</h2>
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${firebaseReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-sm font-semibold">{firebaseReady ? 'Connected to Firebase' : 'Offline mode'}</span>
        </div>
        {user ? (
          <>
            <p className="mb-3 text-sm">Signed in as <span className="font-semibold">{user.email}</span></p>
            <Button variant="danger" className="w-full" onClick={async () => { await signOut(); nav('/') }}>
              <LogOut size={18} /> Sign out
            </Button>
          </>
        ) : firebaseReady ? (
          <Link to="/auth"><Button variant="soft" className="w-full">Sign in / Create account</Button></Link>
        ) : (
          <p className="text-sm text-muted">Tasks, notes, calendar & streaks work offline. Add Firebase keys to enable accounts & chat.</p>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-muted">Vintly · v0.1 · made with ♥</p>
    </div>
  )
}
