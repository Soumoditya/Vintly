// Live weather via Open-Meteo (free, no API key). Location via IP (no native
// permission needed) with manual area search. Accurate current + hourly + daily.

export interface Place { name: string; country: string; admin1?: string; lat: number; lon: number }
export interface CurrentWx {
  temp: number; feels: number; humidity: number; precip: number
  wind: number; code: number; isDay: boolean
}
export interface DailyWx {
  date: string; code: number; tMax: number; tMin: number; rain: number; wind: number; sunrise: string; sunset: string
}
export interface HourlyWx { time: string; temp: number; rain: number; code: number }
export interface WeatherData { current: CurrentWx; daily: DailyWx[]; hourly: HourlyWx[] }

// WMO weather codes → label + emoji
const CODES: Record<number, [string, string]> = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '❄️'], 75: ['Heavy snow', '❄️'], 77: ['Snow grains', '🌨️'],
  80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Violent showers', '⛈️'],
  85: ['Snow showers', '🌨️'], 86: ['Snow showers', '❄️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm + hail', '⛈️'], 99: ['Thunderstorm + hail', '⛈️'],
}
export function wxText(code: number) { return CODES[code]?.[0] || 'Unknown' }
export function wxEmoji(code: number) { return CODES[code]?.[1] || '🌡️' }

export async function searchPlaces(q: string): Promise<Place[]> {
  if (!q.trim()) return []
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`)
  if (!r.ok) return []
  const j = await r.json()
  return (j.results || []).map((p: any) => ({ name: p.name, country: p.country, admin1: p.admin1, lat: p.latitude, lon: p.longitude }))
}

export async function locateByIP(): Promise<Place | null> {
  try {
    const r = await fetch('https://ipapi.co/json/')
    if (!r.ok) return null
    const j = await r.json()
    if (j.latitude == null) return null
    return { name: j.city || 'My location', country: j.country_name || '', admin1: j.region, lat: j.latitude, lon: j.longitude }
  } catch {
    return null
  }
}

export async function getWeather(lat: number, lon: number, days = 16): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day` +
    `&hourly=temperature_2m,precipitation_probability,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset` +
    `&timezone=auto&forecast_days=${days}`
  const r = await fetch(url)
  const j = await r.json()
  const c = j.current
  const current: CurrentWx = {
    temp: Math.round(c.temperature_2m), feels: Math.round(c.apparent_temperature), humidity: c.relative_humidity_2m,
    precip: c.precipitation, wind: Math.round(c.wind_speed_10m), code: c.weather_code, isDay: !!c.is_day,
  }
  const daily: DailyWx[] = j.daily.time.map((d: string, i: number) => ({
    date: d, code: j.daily.weather_code[i], tMax: Math.round(j.daily.temperature_2m_max[i]),
    tMin: Math.round(j.daily.temperature_2m_min[i]), rain: j.daily.precipitation_probability_max[i] ?? 0,
    wind: Math.round(j.daily.wind_speed_10m_max[i]), sunrise: j.daily.sunrise[i], sunset: j.daily.sunset[i],
  }))
  // next 24 hourly entries from now
  const now = Date.now()
  const hourly: HourlyWx[] = j.hourly.time
    .map((t: string, i: number) => ({ time: t, temp: Math.round(j.hourly.temperature_2m[i]), rain: j.hourly.precipitation_probability[i] ?? 0, code: j.hourly.weather_code[i] }))
    .filter((h: HourlyWx) => new Date(h.time).getTime() >= now - 3600000)
    .slice(0, 24)
  return { current, daily, hourly }
}
