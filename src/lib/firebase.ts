// Lazy Firebase wrapper. The app works offline if Firebase isn't configured yet;
// once firebaseConfig.ts is filled in, accounts + chat + media light up.

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig'

let app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null
let _storage: FirebaseStorage | null = null

export const firebaseReady = isFirebaseConfigured

function ensure() {
  if (!isFirebaseConfigured) return false
  if (!app) {
    app = initializeApp(firebaseConfig)
    _auth = getAuth(app)
    _db = getFirestore(app)
    _storage = getStorage(app)
  }
  return true
}

export function getFb() {
  if (!ensure()) return null
  return { app: app!, auth: _auth!, db: _db!, storage: _storage! }
}
