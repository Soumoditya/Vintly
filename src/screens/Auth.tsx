import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { signIn, signUp } from '../lib/auth'
import { firebaseReady } from '../lib/firebase'
import { Input, Button } from '../components/ui'

export default function Auth() {
  const nav = useNavigate()
  const [mode, setMode] = useState<'in' | 'up'>('up')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [username, setUsername] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setErr('')
    if (!firebaseReady) { setErr('Connect Firebase first (Settings → Connect account).'); return }
    setBusy(true)
    try {
      if (mode === 'up') {
        if (username.trim().length < 3) throw new Error('Username must be 3+ characters')
        await signUp(email.trim(), pass, username.trim())
      } else {
        await signIn(email.trim(), pass)
      }
      nav('/chat')
    } catch (e: any) {
      setErr(e?.message?.replace('Firebase:', '').trim() || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="safe-top flex min-h-screen flex-col px-6">
      <button onClick={() => nav(-1)} className="mt-2 w-fit text-muted"><ArrowLeft /></button>
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-brand text-white shadow-glow"><Sparkles /></div>
          <h1 className="text-3xl font-extrabold">Vintly</h1>
          <p className="mt-1 text-muted">{mode === 'up' ? 'Create your account' : 'Welcome back'}</p>
        </div>

        <div className="space-y-3">
          {mode === 'up' && <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} />
          {err && <p className="text-sm text-rose-400">{err}</p>}
          <Button onClick={submit} disabled={busy} className="w-full">{busy ? 'Please wait…' : mode === 'up' ? 'Create account' : 'Sign in'}</Button>
        </div>

        <button onClick={() => setMode(mode === 'up' ? 'in' : 'up')} className="mt-5 text-center text-sm text-muted">
          {mode === 'up' ? 'Already have an account? ' : "Don't have an account? "}
          <span className="font-semibold text-brand">{mode === 'up' ? 'Sign in' : 'Sign up'}</span>
        </button>
      </div>
    </div>
  )
}
