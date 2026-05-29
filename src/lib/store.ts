import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyTheme, type ThemeName } from './theme'

// ---------- Types ----------
export interface Task {
  id: string
  title: string
  notes?: string
  done: boolean
  priority: 'low' | 'med' | 'high'
  due?: number // timestamp
  createdAt: number
  completedAt?: number
  points: number
}

export interface ChecklistItem { id: string; text: string; done: boolean }

export interface Note {
  id: string
  title: string
  body: string
  color: string // rgb triple or '' for default
  pinned: boolean
  archived: boolean
  isChecklist: boolean
  checklist: ChecklistItem[]
  labels: string[]
  font: string // '', 'serif', 'mono', 'rounded'
  bg: string // background pattern key for the note
  updatedAt: number
}

export interface CalEvent {
  id: string
  title: string
  date: number // start timestamp
  end?: number
  color: string
  allDay: boolean
  remindMinsBefore?: number
}

export interface Reminder {
  id: string
  title: string
  at: number
  notifId?: number
  repeat: 'none' | 'daily' | 'weekly'
  done: boolean
}

export interface Profile {
  uid: string | null // set when logged into Firebase
  username: string
  displayName: string
  avatar: string // emoji or url
  bio: string
}

export interface Settings {
  theme: ThemeName
  accent: string // rgb triple
  chatWallpaper: string // css value or ''
  hapticsEnabled: boolean
  stepGoal: number
}

interface Engagement {
  points: number
  streak: number
  longestStreak: number
  lastActiveDay: string // YYYY-MM-DD
  freezes: number
}

interface VintlyState {
  profile: Profile
  tasks: Task[]
  notes: Note[]
  events: CalEvent[]
  reminders: Reminder[]
  engagement: Engagement
  settings: Settings
  steps: { day: string; count: number }

  // profile
  setProfile: (p: Partial<Profile>) => void

  // tasks
  addTask: (t: Partial<Task>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, patch: Partial<Task>) => void

  // notes
  addNote: (n: Partial<Note>) => string
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void

  // events
  addEvent: (e: Partial<CalEvent>) => void
  deleteEvent: (id: string) => void

  // reminders
  addReminder: (r: Reminder) => void
  removeReminder: (id: string) => void

  // engagement
  awardPoints: (n: number) => void
  touchStreak: () => { streakChanged: boolean; streak: number }

  // settings
  setSettings: (s: Partial<Settings>) => void

  // fitness
  setSteps: (count: number) => void
}

const todayKey = () => new Date().toISOString().slice(0, 10)
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const PRIORITY_POINTS = { low: 5, med: 10, high: 20 } as const

export const useStore = create<VintlyState>()(
  persist(
    (set, get) => ({
      profile: { uid: null, username: '', displayName: 'You', avatar: '🦊', bio: '' },
      tasks: [],
      notes: [],
      events: [],
      reminders: [],
      engagement: {
        points: 0,
        streak: 0,
        longestStreak: 0,
        lastActiveDay: '',
        freezes: 2,
      },
      settings: {
        theme: 'midnight',
        accent: '124 92 255',
        chatWallpaper: '',
        hapticsEnabled: true,
        stepGoal: 8000,
      },
      steps: { day: todayKey(), count: 0 },

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

      addTask: (t) =>
        set((s) => ({
          tasks: [
            {
              id: uid(),
              title: t.title || 'Untitled task',
              notes: t.notes || '',
              done: false,
              priority: t.priority || 'med',
              due: t.due,
              createdAt: Date.now(),
              points: PRIORITY_POINTS[t.priority || 'med'],
            },
            ...s.tasks,
          ],
        })),

      toggleTask: (id) => {
        const task = get().tasks.find((t) => t.id === id)
        if (!task) return
        const nowDone = !task.done
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: nowDone, completedAt: nowDone ? Date.now() : undefined } : t,
          ),
        }))
        if (nowDone) {
          get().awardPoints(task.points)
          get().touchStreak()
        } else {
          get().awardPoints(-task.points)
        }
      },

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      addNote: (n) => {
        const id = uid()
        set((s) => ({
          notes: [
            {
              id,
              title: n.title || '',
              body: n.body || '',
              color: n.color || '',
              pinned: false,
              archived: false,
              isChecklist: n.isChecklist ?? false,
              checklist: n.checklist ?? [],
              labels: n.labels ?? [],
              font: n.font ?? '',
              bg: n.bg ?? '',
              updatedAt: Date.now(),
            },
            ...s.notes,
          ],
        }))
        return id
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
        })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      addEvent: (e) =>
        set((s) => ({
          events: [
            ...s.events,
            {
              id: uid(),
              title: e.title || 'Event',
              date: e.date || Date.now(),
              end: e.end,
              color: e.color || '124 92 255',
              allDay: e.allDay ?? false,
              remindMinsBefore: e.remindMinsBefore,
            },
          ],
        })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      addReminder: (r) => set((s) => ({ reminders: [r, ...s.reminders] })),
      removeReminder: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),

      awardPoints: (n) =>
        set((s) => ({
          engagement: { ...s.engagement, points: Math.max(0, s.engagement.points + n) },
        })),

      touchStreak: () => {
        const e = get().engagement
        const today = todayKey()
        if (e.lastActiveDay === today) return { streakChanged: false, streak: e.streak }
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        const continued = e.lastActiveDay === yesterday
        const streak = continued ? e.streak + 1 : 1
        set({
          engagement: {
            ...e,
            streak,
            longestStreak: Math.max(e.longestStreak, streak),
            lastActiveDay: today,
          },
        })
        return { streakChanged: true, streak }
      },

      setSettings: (s) => {
        set((state) => ({ settings: { ...state.settings, ...s } }))
        const ns = get().settings
        applyTheme(ns.theme, ns.accent)
      },

      setSteps: (count) => {
        const day = todayKey()
        set((s) => ({ steps: { day, count: s.steps.day === day ? count : count } }))
      },
    }),
    {
      name: 'vintly-store-v1',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Backfill fields added in later versions so old notes don't crash.
        state.notes = (state.notes || []).map((n: any) => ({
          archived: false,
          isChecklist: false,
          checklist: [],
          labels: [],
          font: '',
          bg: '',
          ...n,
        }))
        applyTheme(state.settings.theme, state.settings.accent)
      },
    },
  ),
)
