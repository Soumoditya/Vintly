import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Check, X } from 'lucide-react'
import { signIn, signUp, resetPassword, usernameAvailable, validUsername } from '../lib/auth'
import { firebaseReady } from '../lib/firebase'
import { Input, Button } from '../components/ui'

export default function Auth() {
  const nav = useNavigate()
  const [mode, setMode] = useState<'in' | 'up'>('up')
  const [identifier, setIdentifier] = useState('') // email or username (sign in)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [username, setUsername] = useState('')
  const [uState, setUState] = useState<'idle' | 'checking' | 'free' | 'taken' | 'invalid'>('idle')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  // Live username availability (Instagram-style)
  useEffect(() => {
    if (mode !== 'up' || !username) { setUState('idle'); return }
    if (!validUsername(username)) { setUState('invalid'); return }
    setUState('checking')
    const t = setTimeout(async () => {
      setUState((await usernameAvailable(username)) ? 'free' : 'taken')
    }, 450)
    return () => clearTimeout(t)
  }, [username, mode])

  async function submit() {
    setErr(''); setMsg('')
    if (!firebaseReady) { setErr('Connect Firebase first (Settings → Account).'); return }
    setBusy(true)
    try {
      if (mode === 'up') {
        if (uState === 'taken') throw new Error('That username is already taken')
        await signUp(email.trim(), pass, username.trim())
      } else {
        await signIn(identifier, pass)
      }
      nav('/chat')
    } catch (e: any) {
      setErr(e?.message?.replace('Firebase:', '').trim() || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function forgot() {
    setErr(''); setMsg('')
    const target = mode === 'in' ? identifier : email
    if (!target.includes('@')) { setErr('Enter your email above to reset your password.'); return }
    try {
      await resetPassword(target)
      setMsg('Password reset email sent — check your inbox.')
    } catch (e: any) {
      setErr(e?.message?.replace('Firebase:', '').trim() || 'Could not send reset email')
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
          {mode === 'up' ? (
            <>
              <div>
                <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
                {username && (
                  <p className={`mt-1 flex items-center gap-1 px-1 text-xs ${uState === 'free' ? 'text-emerald-400' : uState === 'taken' || uState === 'invalid' ? 'text-rose-400' : 'text-muted'}`}>
                    {uState === 'checking' && 'Checking…'}
                    {uState === 'free' && <><Check size={12} /> @{username} is available</>}
                    {uState === 'taken' && <><X size={12} /> @{username} is taken</>}
                    {uState === 'invalid' && '3–20 chars: letters, numbers, . or _'}
                  </p>
                )}
              </div>
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </>
          ) : (
            <Input placeholder="Username or email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          )}
          <Input type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} />
          {err && <p className="text-sm text-rose-400">{err}</p>}
          {msg && <p className="text-sm text-emerald-400">{msg}</p>}
          <Button onClick={submit} disabled={busy} className="w-full">{busy ? 'Please wait…' : mode === 'up' ? 'Create account' : 'Sign in'}</Button>
          {mode === 'in' && <button onClick={forgot} className="w-full text-center text-sm text-brand">Forgot password?</button>}
        </div>

        <button onClick={() => { setMode(mode === 'up' ? 'in' : 'up'); setErr(''); setMsg('') }} className="mt-5 text-center text-sm text-muted">
          {mode === 'up' ? 'Already have an account? ' : "Don't have an account? "}
          <span className="font-semibold text-brand">{mode === 'up' ? 'Sign in' : 'Sign up'}</span>
        </button>
      </div>
    </div>
  )
}
