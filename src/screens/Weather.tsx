import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, MapPin, Wind, Droplets, Thermometer, X, Navigation } from 'lucide-react'
import {
  searchPlaces, locateByIP, getWeather, wxText, wxEmoji,
  type Place, type WeatherData,
} from '../lib/weather'
import { Card } from '../components/ui'

const RANGES = [7, 14, 16]

export default function Weather() {
  const [place, setPlace] = useState<Place | null>(null)
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [days, setDays] = useState(7)
  const [err, setErr] = useState('')

  async function load(p: Place) {
    setLoading(true); setErr('')
    setPlace(p); setResults([]); setQ('')
    try {
      setData(await getWeather(p.lat, p.lon))
    } catch {
      setErr('Could not load weather. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    locateByIP().then((p) => {
      if (p) load(p)
      else { setLoading(false); setErr('Search a city to see its weather.') }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return }
    const t = setTimeout(async () => setResults(await searchPlaces(q)), 350)
    return () => clearTimeout(t)
  }, [q])

  const c = data?.current
  return (
    <div className="safe-top min-h-screen px-5 pb-8" style={{ background: c ? `linear-gradient(180deg, rgb(var(--brand) / ${c.isDay ? 0.22 : 0.08}), rgb(var(--surface)))` : undefined }}>
      <div className="flex items-center gap-3 pt-5 pb-3">
        <Link to="/" className="grid h-11 w-11 place-items-center rounded-2xl bg-card border border-line"><ArrowLeft size={18} /></Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Weather</h1>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <div className="flex items-center gap-2 rounded-2xl bg-card border border-line px-4">
          <Search size={18} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any city or area…" className="flex-1 bg-transparent py-3 outline-none placeholder:text-muted" />
          {q ? <button onClick={() => setQ('')}><X size={18} className="text-muted" /></button>
            : <button onClick={() => locateByIP().then((p) => p && load(p))}><Navigation size={18} className="text-brand" /></button>}
        </div>
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl bg-card border border-line shadow-soft">
            {results.map((p, i) => (
              <button key={i} onClick={() => load(p)} className="flex w-full items-center gap-2 border-b border-line/50 px-4 py-3 text-left last:border-0">
                <MapPin size={15} className="text-muted" />
                <span className="flex-1"><span className="font-medium">{p.name}</span> <span className="text-sm text-muted">{p.admin1 ? `${p.admin1}, ` : ''}{p.country}</span></span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <p className="py-20 text-center text-muted">Loading weather…</p>}
      {err && !loading && <p className="py-20 text-center text-muted">{err}</p>}

      {c && !loading && (
        <>
          {/* Current */}
          <div className="mb-4 text-center">
            <p className="flex items-center justify-center gap-1 text-sm text-muted"><MapPin size={14} /> {place?.name}{place?.country ? `, ${place.country}` : ''}</p>
            <p className="mt-2 text-7xl">{wxEmoji(c.code)}</p>
            <p className="text-6xl font-extrabold">{c.temp}°</p>
            <p className="text-lg font-medium">{wxText(c.code)}</p>
            <p className="text-sm text-muted">Feels like {c.feels}°</p>
          </div>

          {/* Metrics */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Card className="text-center"><Droplets className="mx-auto text-sky-400" size={20} /><p className="mt-1 text-xl font-bold">{data!.daily[0]?.rain ?? 0}%</p><p className="text-xs text-muted">Rain chance</p></Card>
            <Card className="text-center"><Wind className="mx-auto text-emerald-400" size={20} /><p className="mt-1 text-xl font-bold">{c.wind}</p><p className="text-xs text-muted">km/h wind</p></Card>
            <Card className="text-center"><Thermometer className="mx-auto text-rose-400" size={20} /><p className="mt-1 text-xl font-bold">{c.humidity}%</p><p className="text-xs text-muted">Humidity</p></Card>
          </div>

          {/* Hourly */}
          <h2 className="mb-2 font-bold">Next 24 hours</h2>
          <Card className="mb-4 flex gap-4 overflow-x-auto py-3">
            {data!.hourly.map((h, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-1">
                <span className="text-xs text-muted">{i === 0 ? 'Now' : new Date(h.time).toLocaleTimeString([], { hour: '2-digit' })}</span>
                <span className="text-xl">{wxEmoji(h.code)}</span>
                <span className="font-semibold">{h.temp}°</span>
                <span className="text-[10px] text-sky-400">{h.rain}%</span>
              </div>
            ))}
          </Card>

          {/* Daily */}
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">Forecast</h2>
            <div className="flex gap-1">
              {RANGES.map((r) => (
                <button key={r} onClick={() => setDays(r)} className={`rounded-full px-3 py-1 text-xs font-semibold ${days === r ? 'bg-brand text-white' : 'bg-card text-muted border border-line'}`}>{r}d</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {data!.daily.slice(0, days).map((d, i) => (
              <Card key={i} className="flex items-center gap-3 py-3">
                <span className="w-12 text-sm font-medium">{i === 0 ? 'Today' : new Date(d.date).toLocaleDateString([], { weekday: 'short' })}</span>
                <span className="text-2xl">{wxEmoji(d.code)}</span>
                <span className="flex-1 text-sm text-muted">{wxText(d.code)}</span>
                <span className="text-xs text-sky-400">💧{d.rain}%</span>
                <span className="font-semibold">{d.tMax}°<span className="text-muted"> / {d.tMin}°</span></span>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted">Live data from Open-Meteo · up to 16-day forecast</p>
        </>
      )}
    </div>
  )
}
