import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Footprints, Flame, MapPin, Play, Pause, HeartPulse, RefreshCw, Check } from 'lucide-react'
import { useStore } from '../lib/store'
import { Card, Button } from '../components/ui'
import { healthAvailable, requestStepsPermission, getTodaySteps } from '../lib/health'
import { startPedometer, stopPedometer, isPedometerRunning, onPedometerChange } from '../lib/pedometer'

export default function Fitness() {
  const { steps, settings, setSteps } = useStore()
  const [tracking, setTracking] = useState(isPedometerRunning())
  const [hcAvailable, setHcAvailable] = useState(false)
  const [hcConnected, setHcConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const count = steps.count
  const goal = settings.stepGoal
  const pct = Math.min(100, Math.round((count / goal) * 100))
  const kcal = Math.round(count * 0.04)
  const km = (count * 0.000762).toFixed(2)

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
    const off = onPedometerChange(setTracking)
    let timer: any
    healthAvailable().then(async (ok) => {
      setHcAvailable(ok)
      if (ok) { await syncHealth(); timer = setInterval(syncHealth, 20000) }
    })
    return () => { off(); clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="safe-top px-5 pb-6">
      <div className="flex items-center gap-3 pt-5 pb-4">
        <Link to="/" className="grid h-11 w-11 place-items-center rounded-2xl bg-card border border-line"><ArrowLeft size={18} /></Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Fitness</h1>
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
        ) : (
          <Button onClick={() => (tracking ? stopPedometer() : startPedometer())} variant={tracking ? 'danger' : 'primary'} className="mt-6 w-52">
            {tracking ? <><Pause size={18} /> Stop counting</> : <><Play size={18} /> Start counting</>}
          </Button>
        )}
      </Card>

      {/* Health Connect — real, accurate, 24/7 step data */}
      {hcAvailable && (
        <Card className={`mt-3 flex items-center gap-3 ${hcConnected ? 'border-emerald-500/30 bg-emerald-500/10' : ''}`}>
          <div className={`grid h-11 w-11 place-items-center rounded-2xl ${hcConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand/15 text-brand'}`}>
            {hcConnected ? <Check size={20} /> : <HeartPulse size={20} />}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{hcConnected ? 'Synced with Health Connect' : 'Connect Health Connect'}</p>
            <p className="text-xs text-muted">{hcConnected ? 'Accurate steps, counted 24/7 by your phone' : 'Real steps even when the app is closed'}</p>
          </div>
          {!hcConnected && <Button variant="soft" onClick={connectHealth}>Connect</Button>}
        </Card>
      )}

      <p className="mt-3 px-1 text-center text-xs text-muted">
        {hcConnected
          ? 'Steps come from Health Connect — accurate and always on.'
          : tracking
          ? 'Counting in the background while Vintly is open — you can browse other tabs. 🚶'
          : hcAvailable
          ? 'Tip: tap Connect above for accurate 24/7 steps with no app open.'
          : 'In-app counting works while Vintly is open. For 24/7 accuracy, install “Health Connect” from the Play Store, then reopen this screen.'}
      </p>

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
    </div>
  )
}
