// Global pedometer service — runs independently of any screen so step counting
// keeps going while you move around the app (notes, chat, etc.). Uses the
// device motion sensor with a gravity-adaptive peak detector. Health Connect
// (lib/health.ts) is preferred when available; this is the in-app fallback.
import { Capacitor } from '@capacitor/core'
import { useStore } from './store'

let running = false
let remove: null | (() => void) = null
let lastPeak = 0
let gravity = 9.8
let armed = true
const listeners = new Set<(on: boolean) => void>()

function onAccel(x: number, y: number, z: number) {
  const mag = Math.sqrt(x * x + y * y + z * z)
  gravity = gravity * 0.9 + mag * 0.1
  const linear = mag - gravity
  const now = Date.now()
  if (armed && linear > 1.1 && now - lastPeak > 270) {
    armed = false
    lastPeak = now
    useStore.getState().setSteps(useStore.getState().steps.count + 1)
  }
  if (linear < 0.35) armed = true
}

export function isPedometerRunning() {
  return running
}
export function onPedometerChange(cb: (on: boolean) => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
function emit() {
  listeners.forEach((l) => l(running))
}

export async function startPedometer(): Promise<boolean> {
  if (running) return true
  try {
    if (Capacitor.isNativePlatform()) {
      const { Motion } = await import('@capacitor/motion')
      const handle = await Motion.addListener('accel', (e: any) => {
        const a = e.accelerationIncludingGravity || e.acceleration
        if (a) onAccel(a.x, a.y, a.z)
      })
      remove = () => handle.remove()
    } else if (typeof DeviceMotionEvent !== 'undefined') {
      const anyDME = DeviceMotionEvent as any
      if (typeof anyDME.requestPermission === 'function') {
        const res = await anyDME.requestPermission()
        if (res !== 'granted') return false
      }
      const listener = (e: DeviceMotionEvent) => {
        const a = e.accelerationIncludingGravity
        if (a && a.x != null) onAccel(a.x, a.y!, a.z!)
      }
      window.addEventListener('devicemotion', listener)
      remove = () => window.removeEventListener('devicemotion', listener)
    } else {
      return false
    }
    running = true
    emit()
    return true
  } catch {
    return false
  }
}

export function stopPedometer() {
  remove?.()
  remove = null
  running = false
  emit()
}
