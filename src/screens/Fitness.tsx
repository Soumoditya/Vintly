import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Footprints, Flame, MapPin, Play, Pause, HeartPulse, RefreshCw, Check } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { useStore } from '../lib/store'
import { Card, Button } from '../components/ui'
import { healthAvailable, requestStepsPermission, getTodaySteps } from '../lib/health'

// Real steps come from Health Connect when available; otherwise an in-app
// accelerometer counter is used as a fallback.
export default function Fitness() {
  const { steps, setSteps, settings } = useStore()
  const [tracking, setTracking] = useState(false)
  const [supported, setSupported] = useState(true)
  const [hcAvailable, setHcAvailable] = useState(false)
  const [hcConnected, setHcConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const lastPeak = useRef(0)
  const gravity = useRef(9.8) // running baseline; works whether or not gravity is included
  const armed = useRef(true)
  const removeRef = useRef<null | (() => void)>(null)

  const count = steps.count
  const goal = settings.stepGoal
  const pct = Math.min(100, Math.round((count / goal) * 100))
  const kcal = Math.round(count * 0.04)
  const km = (count * 0.000762).toFixed(2)

  function onAccel(x: number, y: number, z: number) {
    const mag = Math.sqrt(x * x + y * y + z * z)
    // Low-pass baseline tracks gravity (≈9.8 if included, ≈0 if not).
    gravity.current = gravity.current * 0.9 + mag * 0.1
    const linear = mag - gravity.current // oscillates around 0 while walking
    const now = Date.now()
    // Peak detection with a refractory period to avoid double-counting.
    if (armed.current && linear > 1.15 && now - lastPeak.current > 280) {
      armed.current = false
      lastPeak.current = now
      setSteps(useStore.getState().steps.count + 1)
    }
    if (linear < 0.35) armed.current = true
  }

  async function start() {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Motion } = await import('@capacitor/motion')
        const handle = await Motion.addListener('accel', (e: any) => {
          const a = e.accelerationIncludingGravity || e.acceleration
          if (a) onAccel(a.x, a.y, a.z)
        })
        removeRef.current = () => handle.remove()
      } else if (typeof DeviceMotionEvent !== 'undefined') {
        const anyDME = DeviceMotionEvent as any
        if (typeof anyDME.requestPermission === 'function') {
          const res = await anyDME.requestPermission()
          if (res !== 'granted') { setSupported(false); return }
        }
        const listener = (e: DeviceMotionEvent) => {
          const a = e.accelerationIncludingGravity
          if (a && a.x != null) onAccel(a.x, a.y!, a.z!)
        }
        window.addEventListener('devicemotion', listener)
        removeRef.current = () => window.removeEventListener('devicemotion', listener)
      } else {
        setSupported(false)
        return
      }
      setTracking(true)
    } catch {
      setSupported(false)
    }
  }

  function stop() {
    removeRef.current?.()
    removeRef.current = null
    setTracking(false)
  }

  // ---- Health Connect (real steps) ----
  async function syncHealth() {
    setSyncing(true)
    const s = await getTodaySteps()
    if (s != null) { setSteps(s); setHcConnected(true) }
    setSyncing(false)
  }
  async function connectHealth() {
    const ok = await requestStepsPermission()
    if (ok) await syncHealth()
  }

  useEffect(() => {
    let timer: any
    healthAvailable().then(async (ok) => {
      setHcAvailable(ok)
      if (ok) {
        await syncHealth()
        // refresh every 30s while the screen is open
        timer = setInterval(syncHealth, 30000)
      }
    })
    return () => { clearInterval(timer); stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="safe-top px-4 pb-6">
      <div className="flex items-center gap-3 py-4">
        <Link to="/" className="grid h-10 w-10 place-items-center rounded-2xl bg-card border border-line"><ArrowLeft size={18} /></Link>
        <h1 className="text-2xl font-extrabold">Fitness</h1>
      </div>

      <Card className="flex flex-col items-center bg-gradient-to-b from-brand/15 to-transparent py-8">
        <div className="relative grid h-48 w-48 place-items-center">
          <svg className="h-48 w-48 -rotate-90">
            <circle cx="96" cy="96" r="84" className="fill-none stroke-line" strokeWidth="14" />
            <circle cx="96" cy="96" r="84" className="fill-none stroke-brand transition-all" strokeWidth="14" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 84} strokeDashoffset={2 * Math.PI * 84 * (1 - pct / 100)} />
          </svg>
          <div className="absolute text-center">
            <Footprints className="mx-auto text-brand" />
            <p className="mt-1 text-4xl font-extrabold">{count.toLocaleString()}</p>
            <p className="text-sm text-muted">/ {goal.toLocaleString()} steps</p>
          </div>
        </div>

        {hcConnected ? (
          <Button onClick={syncHealth} variant="soft" className="mt-6 w-48" disabled={syncing}>
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Refresh steps'}
          </Button>
        ) : supported ? (
          <Button onClick={tracking ? stop : start} variant={tracking ? 'danger' : 'primary'} className="mt-6 w-48">
            {tracking ? <><Pause size={18} /> Stop tracking</> : <><Play size={18} /> Start tracking</>}
          </Button>
        ) : (
          <p className="mt-4 max-w-xs text-center text-sm text-muted">Step tracking runs in the installed app.</p>
        )}
      </Card>

      {/* Health Connect — real, accurate, 24/7 step data */}
      {hcAvailable && (
        <Card className={`mt-3 flex items-center gap-3 ${hcConnected ? 'bg-emerald-500/10 border-emerald-500/30' : ''}`}>
          <div className={`grid h-11 w-11 place-items-center rounded-2xl ${hcConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand/15 text-brand'}`}>
            {hcConnected ? <Check size={20} /> : <HeartPulse size={20} />}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{hcConnected ? 'Synced with Health Connect' : 'Connect Health Connect'}</p>
            <p className="text-xs text-muted">{hcConnected ? 'Accurate steps counted 24/7 by your phone' : 'Get real, accurate steps even when the app is closed'}</p>
          </div>
          {!hcConnected && <Button variant="soft" onClick={connectHealth}>Connect</Button>}
        </Card>
      )}

      {!hcConnected && (
        <p className="mt-3 px-1 text-center text-xs text-muted">
          {hcAvailable
            ? 'Tip: connect Health Connect above for accurate 24/7 step counting (no app needs to stay open).'
            : 'For accurate 24/7 steps, install "Health Connect" from the Play Store, then reopen this screen.'}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card className="text-center">
          <Flame className="mx-auto text-orange-400" />
          <p className="mt-1 text-2xl font-bold">{kcal}</p>
          <p className="text-xs text-muted">kcal burned</p>
        </Card>
        <Card className="text-center">
          <MapPin className="mx-auto text-emerald-400" />
          <p className="mt-1 text-2xl font-bold">{km}</p>
          <p className="text-xs text-muted">km walked</p>
        </Card>
      </div>

      {tracking && <p className="mt-4 text-center text-sm text-brand animate-pulse">Tracking… keep your phone with you 🚶</p>}
    </div>
  )
}
