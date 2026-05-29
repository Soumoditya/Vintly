# Vintly

A premium, all-in-one personal app: **tasks, notes, calendar, reminders/alarms, streaks & points, fitness, and chat** — built as an installable Android app.

- **Tasks** with priorities, points & a Duolingo-style daily streak
- **Notes** (Google Keep–style) with colors & pinning
- **Calendar** with events + reminder notifications
- **Reminders / alarms** via native notifications
- **Chat** with other users — text, GIFs (GIPHY), images, files & voice notes *(needs Firebase)*
- **Fitness** live step counter using the phone's motion sensor
- **Fully themeable** — themes, custom accent colors, chat wallpapers

Built with **React + Vite + Tailwind + Capacitor**. Firebase powers accounts, chat & sync.

---

## 📱 Get the app on your phone (no computer needed)

Every push builds an APK automatically with GitHub Actions:

1. On your phone, open this repo on GitHub → **Releases** (right side / repo menu).
2. Open the release named **"Vintly — latest build"**.
3. Download **`Vintly.apk`**.
4. Tap the downloaded file to install. If Android warns, allow **"Install unknown apps"** for your browser/Files app, then tap install again.

> You can also get it from the **Actions** tab → latest "Build Android APK" run → **Artifacts → Vintly-APK**.

The app works **offline immediately** — tasks, notes, calendar, reminders, streaks & fitness all run locally.

---

## 🔌 Enable accounts + chat (Firebase)

Chat, accounts, media & push need a free Firebase backend. Open
[`src/lib/firebaseConfig.ts`](src/lib/firebaseConfig.ts) — it has the full
step-by-step (doable from a phone). Paste your config, commit, and the next
APK build will have chat enabled.

---

## 🛠 Develop locally (optional, needs a computer)

```bash
npm install
npm run dev        # web preview
npm run build      # production web build
npx cap add android && npx cap sync android   # native shell
```
