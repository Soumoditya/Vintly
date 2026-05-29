// ✅ Firebase is configured for project "vintlyy".
// These web-config values are PUBLIC by design (Google intends them to ship in
// client apps); real security comes from Firestore rules, not from hiding these.
//
// Media (photos, voice notes, files) is NOT stored in Firebase Storage — that
// now requires a paid plan. Vintly uses Cloudinary (free) instead. See
// src/lib/cloudinary.ts.
//
// Remaining one-time setup in the Firebase console (from your phone):
//   • Build → Authentication → Get started → enable "Email/Password".
//   • Build → Firestore Database → Create database → Start in *test mode*.

export const firebaseConfig = {
  apiKey: 'AIzaSyBvFF70OqRN-N9jhN8TLTCgx6j76yoxdNs',
  authDomain: 'vintlyy.firebaseapp.com',
  projectId: 'vintlyy',
  storageBucket: 'vintlyy.firebasestorage.app',
  messagingSenderId: '1085757864702',
  appId: '1:1085757864702:web:e61c8ffcd818301a1f43af',
  measurementId: 'G-NTL7PY9JO1',
}

export const isFirebaseConfigured =
  !firebaseConfig.apiKey.startsWith('YOUR_') && firebaseConfig.apiKey.length > 10
