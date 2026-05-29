import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Image as ImageIcon, Mic, Square, Smile, X, Copy, Trash2 } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { listenMessages, sendMessage, uploadMedia, getConversation, toggleReaction, deleteMessage, type Message } from '../lib/chat'
import { useStore } from '../lib/store'
import { trendingGifs, searchGifs, type Gif } from '../lib/gif'

const REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🙏']

export default function ChatRoom() {
  const { cid = '' } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const wallpaper = useStore((s) => s.settings.chatWallpaper)
  const [msgs, setMsgs] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [name, setName] = useState('Conversation')
  const [gifOpen, setGifOpen] = useState(false)
  const [gifs, setGifs] = useState<Gif[]>([])
  const [gifQuery, setGifQuery] = useState('')
  const [recording, setRecording] = useState(false)
  const [active, setActive] = useState<Message | null>(null) // message with open actions
  const [viewer, setViewer] = useState<string | null>(null) // fullscreen image viewer
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pressTimer = useRef<any>(null)

  useEffect(() => {
    if (!cid) return
    getConversation(cid).then((c) => {
      if (c?.memberNames && user) {
        const otherUid = (c.members || []).find((m: string) => m !== user.uid)
        setName(c.memberNames[otherUid] || 'Conversation')
      }
    })
    return listenMessages(cid, setMsgs)
  }, [cid, user])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    if (gifOpen && gifs.length === 0) trendingGifs().then(setGifs)
  }, [gifOpen])

  async function send() {
    if (!text.trim() || !user) return
    const t = text.trim()
    setText('')
    await sendMessage(cid, user.uid, { kind: 'text', text: t })
  }

  async function pickGif(g: Gif) {
    if (!user) return
    setGifOpen(false)
    await sendMessage(cid, user.uid, { kind: 'gif', mediaUrl: g.url })
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f || !user) return
    const ext = f.name.split('.').pop() || 'bin'
    const url = await uploadMedia(cid, f, ext)
    const kind = f.type.startsWith('image/') ? 'image' : 'file'
    await sendMessage(cid, user.uid, { kind, mediaUrl: url, text: kind === 'file' ? f.name : undefined })
    e.target.value = ''
  }

  async function toggleRecord() {
    if (recording) {
      recRef.current?.stop()
      setRecording(false)
      return
    }
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
      rec.start()
      recRef.current = rec
      setRecording(true)
    } catch {
      alert('Microphone permission needed for voice messages.')
    }
  }

  async function searchGif() {
    setGifs(await searchGifs(gifQuery))
  }

  return (
    <div className="flex h-screen flex-col" style={wallpaper ? { background: wallpaper } : undefined}>
      <header className="safe-top glass flex items-center gap-3 border-b border-line px-3 pb-3">
        <button onClick={() => nav('/chat')} className="text-ink"><ArrowLeft /></button>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/20 font-bold text-brand">{name[0]?.toUpperCase()}</div>
        <p className="flex-1 font-semibold">{name}</p>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {msgs.map((m) => {
          const mine = m.from === user?.uid
          const reactArr = Object.values(m.reactions || {})
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div
                className={`relative max-w-[78%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-brand text-white rounded-br-md' : 'bg-card border border-line/60 rounded-bl-md'}`}
                onContextMenu={(e) => { e.preventDefault(); setActive(m) }}
                onTouchStart={() => { pressTimer.current = setTimeout(() => setActive(m), 450) }}
                onTouchEnd={() => clearTimeout(pressTimer.current)}
                onTouchMove={() => clearTimeout(pressTimer.current)}
              >
                {m.kind === 'text' && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                {(m.kind === 'gif' || m.kind === 'image') && <img src={m.mediaUrl} className="max-h-60 rounded-xl" onClick={() => m.mediaUrl && setViewer(m.mediaUrl)} />}
                {m.kind === 'voice' && <audio controls src={m.mediaUrl} className="h-9" />}
                {m.kind === 'file' && <a href={m.mediaUrl} target="_blank" className="underline">{m.text || 'File'}</a>}
                <p className={`mt-0.5 text-[10px] ${mine ? 'text-white/70' : 'text-muted'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {reactArr.length > 0 && (
                <div className="-mt-1.5 rounded-full bg-card border border-line px-1.5 py-0.5 text-xs">{reactArr.join(' ')}</div>
              )}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Image viewer */}
      {viewer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" onClick={() => setViewer(null)}>
          <button className="absolute right-4 top-6 text-white" onClick={() => setViewer(null)}><X size={28} /></button>
          <img src={viewer} className="max-h-[90vh] max-w-[94vw] object-contain" />
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
            {active.kind === 'text' && (
              <button onClick={() => { navigator.clipboard?.writeText(active.text || ''); setActive(null) }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left"><Copy size={18} /> Copy text</button>
            )}
            {active.from === user?.uid && (
              <button onClick={() => { deleteMessage(cid, active.id); setActive(null) }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-rose-400"><Trash2 size={18} /> Delete</button>
            )}
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

      <div className="safe-bottom flex items-center gap-2 border-t border-line bg-surface px-3 py-2">
        <button onClick={() => setGifOpen((v) => !v)} className="text-muted"><Smile /></button>
        <button onClick={() => fileRef.current?.click()} className="text-muted"><ImageIcon /></button>
        <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,*/*" className="hidden" onChange={onFile} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Message…"
          className="flex-1 rounded-full bg-card border border-line px-4 py-2.5 outline-none"
        />
        {text.trim() ? (
          <button onClick={send} className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white"><Send size={18} /></button>
        ) : (
          <button onClick={toggleRecord} className={`grid h-11 w-11 place-items-center rounded-full ${recording ? 'bg-rose-500 text-white animate-pulse' : 'bg-brand text-white'}`}>
            {recording ? <Square size={18} /> : <Mic size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}
