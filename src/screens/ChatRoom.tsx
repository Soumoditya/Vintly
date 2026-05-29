import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Image as ImageIcon, Mic, Square, Smile, X, Copy, Trash2, Reply, Check, CheckCheck } from 'lucide-react'
import { useAuth } from '../lib/auth'
import {
  listenMessages, sendMessage, uploadMedia, getConversation, toggleReaction, deleteMessage,
  setTyping, markRead, listenConversation, heartbeat, listenPresence, type Message, type ReplyRef,
} from '../lib/chat'
import { useStore } from '../lib/store'
import { trendingGifs, searchGifs, type Gif } from '../lib/gif'

const REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🙏']
const snippet = (m: Message) => m.kind === 'text' ? (m.text || '') : `[${m.kind}]`

export default function ChatRoom() {
  const { cid = '' } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const wallpaper = useStore((s) => s.settings.chatWallpaper)
  const [msgs, setMsgs] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [name, setName] = useState('Conversation')
  const [otherUid, setOtherUid] = useState('')
  const [conv, setConv] = useState<any>({})
  const [lastSeen, setLastSeen] = useState(0)
  const [gifOpen, setGifOpen] = useState(false)
  const [gifs, setGifs] = useState<Gif[]>([])
  const [gifQuery, setGifQuery] = useState('')
  const [recording, setRecording] = useState(false)
  const [active, setActive] = useState<Message | null>(null)
  const [viewer, setViewer] = useState<{ url: string; video: boolean } | null>(null)
  const [zoom, setZoom] = useState(false)
  const [reply, setReply] = useState<ReplyRef | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pressTimer = useRef<any>(null)
  const typingTimer = useRef<any>(null)
  const swipe = useRef<{ x: number; el: HTMLElement | null }>({ x: 0, el: null })

  useEffect(() => {
    if (!cid || !user) return
    getConversation(cid).then((c) => {
      if (c?.memberNames) {
        const o = (c.members || []).find((m: string) => m !== user.uid)
        setOtherUid(o || '')
        setName(c.memberNames[o] || 'Conversation')
      }
    })
    const u1 = listenMessages(cid, (m) => { setMsgs(m); markRead(cid, user.uid) })
    const u2 = listenConversation(cid, setConv)
    markRead(cid, user.uid)
    heartbeat(user.uid)
    const hb = setInterval(() => heartbeat(user.uid), 25000)
    return () => { u1(); u2(); clearInterval(hb) }
  }, [cid, user])

  useEffect(() => {
    if (!otherUid) return
    return listenPresence(otherUid, setLastSeen)
  }, [otherUid])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])
  useEffect(() => { if (gifOpen && gifs.length === 0) trendingGifs().then(setGifs) }, [gifOpen])

  // typing indicator
  function onType(v: string) {
    setText(v)
    if (!user) return
    setTyping(cid, user.uid, true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setTyping(cid, user.uid, false), 2500)
  }

  async function send() {
    if (!text.trim() || !user) return
    const t = text.trim()
    setText(''); setReply(null)
    setTyping(cid, user.uid, false)
    await sendMessage(cid, user.uid, { kind: 'text', text: t, replyTo: reply || undefined })
  }
  async function pickGif(g: Gif) {
    if (!user) return
    setGifOpen(false)
    await sendMessage(cid, user.uid, { kind: 'gif', mediaUrl: g.url, replyTo: reply || undefined })
    setReply(null)
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f || !user) return
    const ext = (f.name.split('.').pop() || 'bin').toLowerCase()
    const url = await uploadMedia(cid, f, ext)
    const kind = f.type.startsWith('image/') ? 'image' : f.type.startsWith('video/') ? 'video' : 'file'
    await sendMessage(cid, user.uid, { kind, mediaUrl: url, text: kind === 'file' ? f.name : undefined, replyTo: reply || undefined })
    setReply(null)
    e.target.value = ''
  }
  async function toggleRecord() {
    if (recording) { recRef.current?.stop(); setRecording(false); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (ev) => chunksRef.current.push(ev.data)
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        if (user && blob.size > 0) {
          const url = await uploadMedia(cid, blob, 'webm')
          await sendMessage(cid, user.uid, { kind: 'voice', mediaUrl: url })
        }
      }
      rec.start(); recRef.current = rec; setRecording(true)
    } catch { alert('Microphone permission needed for voice messages.') }
  }
  async function searchGif() { setGifs(await searchGifs(gifQuery)) }

  // swipe-to-reply (drag a bubble right)
  function swipeStart(e: React.TouchEvent, m: Message) {
    swipe.current = { x: e.touches[0].clientX, el: e.currentTarget as HTMLElement }
    pressTimer.current = setTimeout(() => setActive(m), 450)
  }
  function swipeMove(e: React.TouchEvent) {
    clearTimeout(pressTimer.current)
    const dx = e.touches[0].clientX - swipe.current.x
    if (dx > 0 && swipe.current.el) swipe.current.el.style.transform = `translateX(${Math.min(dx, 70)}px)`
  }
  function swipeEnd(e: React.TouchEvent, m: Message) {
    clearTimeout(pressTimer.current)
    const dx = e.changedTouches[0].clientX - swipe.current.x
    if (swipe.current.el) swipe.current.el.style.transform = ''
    if (dx > 55) setReply({ id: m.id, snippet: snippet(m).slice(0, 60), from: m.from })
  }

  const otherTyping = otherUid && conv?.typing?.[otherUid] && Date.now() - conv.typing[otherUid] < 5000
  const online = lastSeen && Date.now() - lastSeen < 60000
  const otherRead = (otherUid && conv?.lastRead?.[otherUid]) || 0
  const status = otherTyping ? 'typing…' : online ? 'online' : lastSeen ? `last seen ${new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''

  return (
    <div className="flex h-screen flex-col" style={wallpaper ? { background: wallpaper } : undefined}>
      <header className="safe-top glass flex items-center gap-3 border-b border-line px-3 pb-3">
        <button onClick={() => nav('/chat')} className="text-ink"><ArrowLeft /></button>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/20 font-bold text-brand">{name[0]?.toUpperCase()}</div>
        <div className="flex-1">
          <p className="font-semibold leading-tight">{name}</p>
          {status && <p className={`text-xs ${otherTyping || online ? 'text-emerald-400' : 'text-muted'}`}>{status}</p>}
        </div>
      </header>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {msgs.map((m) => {
          const mine = m.from === user?.uid
          const reactArr = Object.values(m.reactions || {})
          const read = mine && otherRead >= m.createdAt
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div
                className={`relative max-w-[80%] rounded-2xl px-3 py-2 text-sm transition-transform ${mine ? 'bg-brand text-white rounded-br-md' : 'bg-card border border-line/60 rounded-bl-md'}`}
                onContextMenu={(e) => { e.preventDefault(); setActive(m) }}
                onTouchStart={(e) => swipeStart(e, m)}
                onTouchMove={swipeMove}
                onTouchEnd={(e) => swipeEnd(e, m)}
              >
                {m.replyTo && (
                  <div className={`mb-1 rounded-lg border-l-2 px-2 py-1 text-xs ${mine ? 'border-white/60 bg-white/10' : 'border-brand bg-brand/10'}`}>
                    <span className="opacity-80">{m.replyTo.snippet || 'media'}</span>
                  </div>
                )}
                {m.kind === 'text' && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                {(m.kind === 'gif' || m.kind === 'image') && <img src={m.mediaUrl} className="max-h-60 rounded-xl" onClick={() => m.mediaUrl && setViewer({ url: m.mediaUrl, video: false })} />}
                {m.kind === 'video' && <video src={m.mediaUrl} className="max-h-60 rounded-xl" onClick={() => m.mediaUrl && setViewer({ url: m.mediaUrl, video: true })} muted playsInline />}
                {m.kind === 'voice' && <audio controls src={m.mediaUrl} className="h-9" />}
                {m.kind === 'file' && <a href={m.mediaUrl} target="_blank" className="underline">{m.text || 'File'}</a>}
                <span className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-white/70' : 'text-muted'}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {mine && (read ? <CheckCheck size={13} /> : <Check size={13} />)}
                </span>
              </div>
              {reactArr.length > 0 && <div className="-mt-1.5 rounded-full bg-card border border-line px-1.5 py-0.5 text-xs">{reactArr.join(' ')}</div>}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Media viewer (zoom + native video controls incl. mute) */}
      {viewer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95" onClick={() => { setViewer(null); setZoom(false) }}>
          <button className="absolute right-4 top-6 z-10 text-white" onClick={() => { setViewer(null); setZoom(false) }}><X size={28} /></button>
          {viewer.video
            ? <video src={viewer.url} controls autoPlay className="max-h-[92vh] max-w-[96vw]" onClick={(e) => e.stopPropagation()} />
            : <img src={viewer.url} onClick={(e) => { e.stopPropagation(); setZoom((z) => !z) }} className="max-h-[92vh] max-w-[96vw] object-contain transition-transform" style={{ transform: zoom ? 'scale(2)' : 'scale(1)' }} />}
        </div>
      )}

      {/* Long-press message actions */}
      {active && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setActive(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative mb-6 w-full max-w-sm rounded-3xl bg-card border border-line p-3 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-around">
              {REACTIONS.map((r) => (
                <button key={r} onClick={() => { if (user) toggleReaction(cid, active.id, user.uid, r); setActive(null) }} className="grid h-11 w-11 place-items-center rounded-full text-2xl active:scale-90">{r}</button>
              ))}
            </div>
            <div className="h-px bg-line" />
            <button onClick={() => { setReply({ id: active.id, snippet: snippet(active).slice(0, 60), from: active.from }); setActive(null) }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left"><Reply size={18} /> Reply</button>
            {active.kind === 'text' && <button onClick={() => { navigator.clipboard?.writeText(active.text || ''); setActive(null) }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left"><Copy size={18} /> Copy text</button>}
            {active.from === user?.uid && <button onClick={() => { deleteMessage(cid, active.id); setActive(null) }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-rose-400"><Trash2 size={18} /> Delete</button>}
          </div>
        </div>
      )}

      {gifOpen && (
        <div className="border-t border-line bg-card p-3">
          <div className="mb-2 flex items-center gap-2">
            <input value={gifQuery} onChange={(e) => setGifQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchGif()} placeholder="Search GIPHY…" className="flex-1 rounded-2xl bg-surface px-3 py-2 outline-none" />
            <button onClick={() => setGifOpen(false)}><X /></button>
          </div>
          <div className="grid max-h-48 grid-cols-3 gap-1 overflow-y-auto">
            {gifs.map((g) => <img key={g.id} src={g.preview} onClick={() => pickGif(g)} className="h-24 w-full rounded-lg object-cover" />)}
          </div>
        </div>
      )}

      {/* reply preview */}
      {reply && (
        <div className="flex items-center gap-2 border-t border-line bg-card px-4 py-2">
          <Reply size={16} className="text-brand" />
          <span className="flex-1 truncate text-sm text-muted">Replying: {reply.snippet || 'media'}</span>
          <button onClick={() => setReply(null)}><X size={16} className="text-muted" /></button>
        </div>
      )}

      <div className="safe-bottom flex items-center gap-2 border-t border-line bg-surface px-3 py-2">
        <button onClick={() => setGifOpen((v) => !v)} className="text-muted"><Smile /></button>
        <button onClick={() => fileRef.current?.click()} className="text-muted"><ImageIcon /></button>
        <input ref={fileRef} type="file" accept="image/*,video/*,*/*" className="hidden" onChange={onFile} />
        <input value={text} onChange={(e) => onType(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Message…" className="flex-1 rounded-full bg-card border border-line px-4 py-2.5 outline-none" />
        {text.trim()
          ? <button onClick={send} className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white"><Send size={18} /></button>
          : <button onClick={toggleRecord} className={`grid h-11 w-11 place-items-center rounded-full ${recording ? 'bg-rose-500 text-white animate-pulse' : 'bg-brand text-white'}`}>{recording ? <Square size={18} /> : <Mic size={18} />}</button>}
      </div>
    </div>
  )
}
