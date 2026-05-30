// Auth hook backed by Firebase, degrading to a local "guest" identity offline.
import { useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { getFb, firebaseReady } from './firebase'
import { useStore } from './store'

export interface AuthState {
  user: User | null
  loading: boolean
  ready: boolean // firebase configured?
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(firebaseReady)
  const setProfile = useStore((s) => s.setProfile)

  useEffect(() => {
    const fb = getFb()
    if (!fb) {
      setLoading(false)
      return
    }
    return onAuthStateChanged(fb.auth, (u) => {
      setUser(u)
      setLoading(false)
      if (u) {
        setProfile({
          uid: u.uid,
          displayName: u.displayName || 'You',
          username: (u.email || '').split('@')[0],
        })
      } else {
        setProfile({ uid: null })
      }
    })
  }, [setProfile])

  return { user, loading, ready: firebaseReady }
}

// Username rules (Instagram-style): 3–20 chars, letters/numbers/._ only.
export function validUsername(u: string) {
  return /^[a-z0-9._]{3,20}$/.test(u.toLowerCase())
}

export async function usernameAvailable(username: string): Promise<boolean> {
  const fb = getFb()
  if (!fb) return false
  const q = query(collection(fb.db, 'users'), where('usernameLower', '==', username.toLowerCase().trim()), limit(1))
  const snap = await getDocs(q)
  return snap.empty
}

async function emailForUsername(username: string): Promise<string | null> {
  const fb = getFb()
  if (!fb) return null
  const q = query(collection(fb.db, 'users'), where('usernameLower', '==', username.toLowerCase().trim()), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return (snap.docs[0].data() as any).email || null
}

export async function signUp(email: string, password: string, username: string) {
  const fb = getFb()
  if (!fb) throw new Error('offline')
  if (!validUsername(username)) throw new Error('Username must be 3–20 chars (letters, numbers, . or _)')
  if (!(await usernameAvailable(username))) throw new Error('That username is already taken')
  const cred = await createUserWithEmailAndPassword(fb.auth, email, password)
  await updateProfile(cred.user, { displayName: username })
  await setDoc(doc(fb.db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    username,
    usernameLower: username.toLowerCase(),
    email,
    createdAt: serverTimestamp(),
  })
  return cred.user
}

// Accepts an email OR a username as the identifier.
export async function signIn(identifier: string, password: string) {
  const fb = getFb()
  if (!fb) throw new Error('offline')
  let email = identifier.trim()
  if (!email.includes('@')) {
    const found = await emailForUsername(email)
    if (!found) throw new Error('No account with that username')
    email = found
  }
  const cred = await signInWithEmailAndPassword(fb.auth, email, password)
  return cred.user
}

// Sync a changed username to the public profile (so chat search finds you).
// Returns true on success, false if taken/invalid/offline.
export async function syncUsername(uid: string, username: string): Promise<boolean> {
  const fb = getFb()
  if (!fb || !validUsername(username)) return false
  const cur = await getDocs(query(collection(fb.db, 'users'), where('usernameLower', '==', username.toLowerCase()), limit(1)))
  if (!cur.empty && (cur.docs[0].data() as any).uid !== uid) return false // taken by someone else
  await setDoc(doc(fb.db, 'users', uid), { username, usernameLower: username.toLowerCase() }, { merge: true })
  return true
}

export async function resetPassword(email: string) {
  const fb = getFb()
  if (!fb) throw new Error('offline')
  await sendPasswordResetEmail(fb.auth, email.trim())
}

export async function signOut() {
  const fb = getFb()
  if (fb) await fbSignOut(fb.auth)
}
