// 👇 PASTE YOUR FIREBASE CONFIG HERE (Phase 2: accounts + chat + push)
//
// How to get it from your PHONE (no computer needed):
//  1. Go to  https://console.firebase.google.com  and sign in with Google.
//  2. Tap "Create a project" → name it "Vintly" → Continue (you can disable Analytics).
//  3. Inside the project, tap the </> "Web" icon to "Add a web app", nickname "Vintly".
//  4. Firebase shows a `firebaseConfig = { ... }` block. Copy those values below.
//  5. In the left menu: Build → Authentication → Get started → enable "Email/Password".
//  6. Build → Firestore Database → Create database → Start in *test mode* (for now).
//  7. Build → Storage → Get started (for sending media in chat).
//
// These keys are SAFE to commit — Firebase web config is public by design;
// security is enforced by Firestore/Storage rules, not by hiding these.
//
// Until you fill these in, Vintly runs fully in OFFLINE mode (tasks, notes,
// calendar, reminders, streaks all work locally on your device).

export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
}

export const isFirebaseConfigured =
  !firebaseConfig.apiKey.startsWith('YOUR_') &&
  firebaseConfig.apiKey.length > 10
