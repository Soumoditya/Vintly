// Auth hook backed by Firebase, degrading to a local "guest" identity offline.
import { useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
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

export async function signUp(email: string, password: string, username: string) {
  const fb = getFb()
  if (!fb) throw new Error('offline')
  const cred = await createUserWithEmailAndPassword(fb.auth, email, password)
  await updateProfile(cred.user, { displayName: username })
  // Public profile doc so others can find you to chat.
  await setDoc(doc(fb.db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    username,
    usernameLower: username.toLowerCase(),
    email,
    createdAt: serverTimestamp(),
  })
  return cred.user
}

export async function signIn(email: string, password: string) {
  const fb = getFb()
  if (!fb) throw new Error('offline')
  const cred = await signInWithEmailAndPassword(fb.auth, email, password)
  return cred.user
}

export async function signOut() {
  const fb = getFb()
  if (fb) await fbSignOut(fb.auth)
}
