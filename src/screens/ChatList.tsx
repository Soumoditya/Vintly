import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Plus, Search, Lock, Pin } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { listenConversations, findUserByUsername, ensureConversation, convId } from '../lib/chat'
import { useStore } from '../lib/store'
import { Sheet, Input, Button, EmptyState, Card } from '../components/ui'

export default function ChatList() {
  const { user, ready } = useAuth()
  const profile = useStore((s) => s.profile)
  const pinned = useStore((s) => s.pinnedChats)
  const togglePinChat = useStore((s) => s.togglePinChat)
  const pressTimer = useRef<any>(null)
  const nav = useNavigate()
  const [convs, setConvs] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [uname, setUname] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!user) return
    return listenConversations(user.uid, setConvs)
  }, [user])

  if (!ready) {
    return (
      <div className="safe-top px-4">
        <h1 className="py-4 text-2xl font-extrabold">Chat</h1>
        <Card className="text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-3xl bg-brand/15 text-brand"><Lock /></div>
          <p className="font-semibold">Connect your account to chat</p>
          <p className="mt-1 text-sm text-muted">Chat, GIFs, media & voice need a free Firebase backend. It takes ~3 minutes from your phone — open Settings → "Connect account" for steps.</p>
          <Button variant="soft" className="mt-4 w-full" onClick={() => nav('/settings')}>How to enable</Button>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="safe-top px-4">
        <h1 className="py-4 text-2xl font-extrabold">Chat</h1>
        <EmptyState icon={<MessageCircle />} title="Sign in to start chatting" hint="Create your Vintly account to message friends." />
        <Button className="w-full" onClick={() => nav('/auth')}>Sign in / Create account</Button>
      </div>
    )
  }

  async function startChat() {
    setErr('')
    const found = await findUserByUsername(uname)
    if (!found) { setErr('No user with that username'); return }
    if (found.uid === user!.uid) { setErr("That's you 🙂"); return }
    await ensureConversation(
      { uid: user!.uid, username: profile.username || 'me' },
      found,
    )
    setOpen(false)
    setUname('')
    nav(`/chat/${convId(user!.uid, found.uid)}`)
  }

  return (
    <div className="safe-top px-4 pb-6">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-extrabold">Chat</h1>
        <button onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white shadow-glow"><Plus size={22} /></button>
      </div>

      {convs.length === 0 ? (
        <EmptyState icon={<MessageCircle />} title="No conversations yet" hint="Tap + and enter a friend's username to start chatting." />
      ) : (
        <div className="space-y-2">
          {[...convs].sort((a, b) => (pinned.includes(b.id) ? 1 : 0) - (pinned.includes(a.id) ? 1 : 0)).map((c) => {
            const otherUid = (c.members || []).find((m: string) => m !== user.uid)
            const name = c.memberNames?.[otherUid] || 'User'
            const isPinned = pinned.includes(c.id)
            return (
              <button
                key={c.id}
                onClick={() => nav(`/chat/${c.id}`)}
                onContextMenu={(e) => { e.preventDefault(); togglePinChat(c.id) }}
                onTouchStart={() => { pressTimer.current = setTimeout(() => togglePinChat(c.id), 500) }}
                onTouchEnd={() => clearTimeout(pressTimer.current)}
                onTouchMove={() => clearTimeout(pressTimer.current)}
                className="flex w-full items-center gap-3 rounded-xl2 bg-card border border-line/60 p-3 text-left"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/20 text-lg font-bold text-brand">{name[0]?.toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{name}</p>
                  <p className="truncate text-sm text-muted">{c.lastText || 'Say hi 👋'}</p>
                </div>
                {isPinned && <Pin size={15} className="text-brand" fill="currentColor" />}
              </button>
            )
          })}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New chat">
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl bg-surface border border-line px-3">
            <Search size={18} className="text-muted" />
            <input autoFocus placeholder="Enter username" value={uname} onChange={(e) => setUname(e.target.value)} className="flex-1 bg-transparent py-3 outline-none" />
          </div>
          {err && <p className="text-sm text-rose-400">{err}</p>}
          <Button onClick={startChat} className="w-full">Start chat</Button>
        </div>
      </Sheet>
    </div>
  )
}
