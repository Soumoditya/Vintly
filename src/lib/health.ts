// Real step counting via Android Health Connect (free, no card needed).
// The OS / Health Connect counts steps 24/7 using the phone's hardware
// pedometer; we just read the aggregated total. Degrades gracefully when
// Health Connect isn't available (older phones, web) — the caller can then
// fall back to the in-app motion-sensor counter.
import { Capacitor } from '@capacitor/core'

let plugin: any = null

async function load(): Promise<any | null> {
  if (!Capacitor.isNativePlatform()) return null
  if (!plugin) {
    try {
      const mod: any = await import('capacitor-health')
      plugin = mod.Health || mod.default || null
    } catch {
      return null
    }
  }
  return plugin
}

export async function healthAvailable(): Promise<boolean> {
  const p = await load()
  if (!p) return false
  try {
    const r = await p.isHealthAvailable()
    return !!r?.available
  } catch {
    return false
  }
}

export async function requestStepsPermission(): Promise<boolean> {
  const p = await load()
  if (!p) return false
  try {
    await p.requestHealthPermissions({ permissions: ['READ_STEPS'] })
    return true
  } catch {
    return false
  }
}

export async function getTodaySteps(): Promise<number | null> {
  const p = await load()
  if (!p) return null
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  try {
    const res = await p.queryAggregated({
      startDate: start.toISOString(),
      endDate: new Date().toISOString(),
      dataType: 'steps',
      bucket: 'day',
    })
    const data = res?.aggregatedData || []
    const total = data.reduce((a: number, d: any) => a + (Number(d?.value) || 0), 0)
    return Math.round(total)
  } catch {
    return null
  }
}
