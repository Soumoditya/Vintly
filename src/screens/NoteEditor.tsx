import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pin, Trash2, Archive, ArchiveRestore, ListChecks, Tag, Check,
  Bold, Italic, Underline, List, Palette, Type, Plus, X, Square, CheckSquare,
} from 'lucide-react'
import { useStore, type ChecklistItem } from '../lib/store'

const COLORS = ['', '124 92 255', '16 185 129', '244 63 94', '245 158 11', '14 165 233', '236 72 153']
const FONTS = [
  { key: '', label: 'Default', cls: 'font-sans' },
  { key: 'serif', label: 'Serif', cls: 'font-serif' },
  { key: 'mono', label: 'Mono', cls: 'font-mono' },
  { key: 'casual', label: 'Casual', cls: 'italic' },
]
const BGS = [
  { key: '', label: 'None', css: '' },
  { key: 'sunset', label: 'Sunset', css: 'linear-gradient(160deg, rgba(244,63,94,0.18), rgba(245,158,11,0.12))' },
  { key: 'mint', label: 'Mint', css: 'linear-gradient(160deg, rgba(16,185,129,0.16), rgba(14,165,233,0.1))' },
  { key: 'grape', label: 'Grape', css: 'linear-gradient(160deg, rgba(124,92,255,0.2), rgba(236,72,153,0.12))' },
  { key: 'dots', label: 'Dots', css: 'radial-gradient(rgb(var(--muted)/0.25) 1px, transparent 1px) 0 0/16px 16px' },
]
const uid = () => Math.random().toString(36).slice(2)

export function fontClass(font: string) {
  return FONTS.find((f) => f.key === font)?.cls || 'font-sans'
}
export function noteBgCss(bg: string) {
  return BGS.find((b) => b.key === bg)?.css || ''
}

export default function NoteEditor() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const note = useStore((s) => s.notes.find((n) => n.id === id))
  const { updateNote, deleteNote } = useStore()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [panel, setPanel] = useState<'color' | 'font' | 'bg' | 'label' | null>(null)
  const [labelInput, setLabelInput] = useState('')
  const initialBody = useRef(note?.body ?? '')

  useEffect(() => {
    if (bodyRef.current && bodyRef.current.innerHTML !== initialBody.current) {
      bodyRef.current.innerHTML = initialBody.current
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!note) {
    return (
      <div className="safe-top px-5 pt-10 text-center text-muted">
        Note not found. <button onClick={() => nav('/notes')} className="text-brand">Back to notes</button>
      </div>
    )
  }

  const isEmpty = () =>
    !note.title.trim() && !note.body.replace(/<[^>]*>/g, '').trim() && !note.checklist.some((c) => c.text.trim())

  function back() {
    if (isEmpty()) deleteNote(note!.id)
    nav('/notes')
  }
  function exec(cmd: string) {
    document.execCommand(cmd, false)
    bodyRef.current?.focus()
    if (bodyRef.current) updateNote(note!.id, { body: bodyRef.current.innerHTML })
  }
  function setItem(cid: string, p: Partial<ChecklistItem>) {
    updateNote(note!.id, { checklist: note!.checklist.map((c) => (c.id === cid ? { ...c, ...p } : c)) })
  }
  function addItem() {
    updateNote(note!.id, { checklist: [...note!.checklist, { id: uid(), text: '', done: false }] })
  }

  const tintBg = note.color ? `rgb(${note.color} / 0.14)` : ''
  const surfaceBg = noteBgCss(note.bg) || tintBg || 'rgb(var(--surface))'

  return (
    <div className="flex min-h-screen flex-col" style={{ background: surfaceBg }}>
      {/* Top bar */}
      <header className="safe-top sticky top-0 z-10 flex items-center justify-between gap-2 px-3 pb-2 backdrop-blur-sm">
        <button onClick={back} className="grid h-11 w-11 place-items-center rounded-2xl"><ArrowLeft /></button>
        <div className="flex items-center gap-1">
          <button onClick={() => updateNote(note.id, { pinned: !note.pinned })} className={`grid h-11 w-11 place-items-center rounded-2xl ${note.pinned ? 'text-brand' : 'text-muted'}`}>
            <Pin size={20} fill={note.pinned ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => updateNote(note.id, { isChecklist: !note.isChecklist })} className={`grid h-11 w-11 place-items-center rounded-2xl ${note.isChecklist ? 'text-brand' : 'text-muted'}`}>
            <ListChecks size={20} />
          </button>
          <button onClick={() => { updateNote(note.id, { archived: !note.archived }); nav('/notes') }} className="grid h-11 w-11 place-items-center rounded-2xl text-muted">
            {note.archived ? <ArchiveRestore size={20} /> : <Archive size={20} />}
          </button>
          <button onClick={() => { deleteNote(note.id); nav('/notes') }} className="grid h-11 w-11 place-items-center rounded-2xl text-rose-400">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className={`flex-1 overflow-y-auto px-5 pb-40 ${fontClass(note.font)}`}>
        <input
          placeholder="Title"
          defaultValue={note.title}
          onChange={(e) => updateNote(note.id, { title: e.target.value })}
          className="mt-2 w-full bg-transparent text-2xl font-bold outline-none placeholder:text-muted"
        />

        {note.isChecklist ? (
          <div className="mt-4 space-y-2.5">
            {note.checklist.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <button onClick={() => setItem(c.id, { done: !c.done })}>
                  {c.done ? <CheckSquare size={22} className="text-brand" /> : <Square size={22} className="text-muted" />}
                </button>
                <input
                  defaultValue={c.text}
                  onChange={(e) => setItem(c.id, { text: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
                  placeholder="List item"
                  className={`flex-1 bg-transparent py-1 text-lg outline-none ${c.done ? 'text-muted line-through' : ''}`}
                />
                <button onClick={() => updateNote(note.id, { checklist: note.checklist.filter((x) => x.id !== c.id) })} className="text-muted"><X size={18} /></button>
              </div>
            ))}
            <button onClick={addItem} className="flex items-center gap-2 py-1 font-medium text-brand"><Plus size={18} /> Add item</button>
          </div>
        ) : (
          <div
            ref={bodyRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => updateNote(note.id, { body: (e.target as HTMLDivElement).innerHTML })}
            data-placeholder="Take a note…"
            className="mt-4 min-h-[40vh] text-lg leading-relaxed outline-none empty:before:text-muted empty:before:content-[attr(data-placeholder)]"
          />
        )}

        {/* Labels */}
        {note.labels.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {note.labels.map((l) => (
              <span key={l} className="flex items-center gap-1 rounded-full bg-brand/15 px-3 py-1 text-sm font-medium text-brand">
                {l}<button onClick={() => updateNote(note.id, { labels: note.labels.filter((x) => x !== l) })}><X size={13} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Formatting toolbar */}
      <div className="safe-bottom fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-line glass">
        {/* Expanded panels */}
        {panel === 'color' && (
          <div className="flex gap-2 overflow-x-auto px-4 pt-3">
            {COLORS.map((c) => (
              <button key={c || 'n'} onClick={() => updateNote(note.id, { color: c })} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 ${note.color === c ? 'border-brand' : 'border-line'}`} style={{ background: c ? `rgb(${c}/0.4)` : 'rgb(var(--surface))' }}>
                {note.color === c && <Check size={14} />}
              </button>
            ))}
          </div>
        )}
        {panel === 'font' && (
          <div className="flex gap-2 overflow-x-auto px-4 pt-3">
            {FONTS.map((f) => (
              <button key={f.key} onClick={() => updateNote(note.id, { font: f.key })} className={`shrink-0 rounded-full px-4 py-2 text-sm ${f.cls} ${note.font === f.key ? 'bg-brand/20 text-brand' : 'bg-surface text-muted'}`}>{f.label}</button>
            ))}
          </div>
        )}
        {panel === 'bg' && (
          <div className="flex gap-2 overflow-x-auto px-4 pt-3">
            {BGS.map((b) => (
              <button key={b.key} onClick={() => updateNote(note.id, { bg: b.key })} className={`grid h-12 w-16 shrink-0 place-items-center rounded-xl border text-[10px] ${note.bg === b.key ? 'border-brand text-brand' : 'border-line text-muted'}`} style={{ background: b.css || 'rgb(var(--surface))' }}>{b.label}</button>
            ))}
          </div>
        )}
        {panel === 'label' && (
          <div className="flex items-center gap-2 px-4 pt-3">
            <Tag size={16} className="text-muted" />
            <input value={labelInput} onChange={(e) => setLabelInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && labelInput.trim()) { if (!note.labels.includes(labelInput.trim())) updateNote(note.id, { labels: [...note.labels, labelInput.trim()] }); setLabelInput('') } }} placeholder="Add label, press Enter" className="flex-1 rounded-full bg-surface px-4 py-2 text-sm outline-none" />
          </div>
        )}

        <div className="flex items-center justify-around px-2 py-2">
          {!note.isChecklist && (
            <>
              <ToolBtn onClick={() => exec('bold')} icon={<Bold size={20} />} />
              <ToolBtn onClick={() => exec('italic')} icon={<Italic size={20} />} />
              <ToolBtn onClick={() => exec('underline')} icon={<Underline size={20} />} />
              <ToolBtn onClick={() => exec('insertUnorderedList')} icon={<List size={20} />} />
              <ToolBtn onClick={() => setPanel(panel === 'font' ? null : 'font')} icon={<Type size={20} />} active={panel === 'font'} />
            </>
          )}
          <ToolBtn onClick={() => setPanel(panel === 'color' ? null : 'color')} icon={<Palette size={20} />} active={panel === 'color'} />
          <ToolBtn onClick={() => setPanel(panel === 'bg' ? null : 'bg')} icon={<span className="h-5 w-5 rounded-md bg-gradient-to-br from-brand to-pink-400" />} active={panel === 'bg'} />
          <ToolBtn onClick={() => setPanel(panel === 'label' ? null : 'label')} icon={<Tag size={20} />} active={panel === 'label'} />
        </div>
      </div>
    </div>
  )
}

function ToolBtn({ onClick, icon, active }: { onClick: () => void; icon: React.ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} className={`grid h-11 w-11 place-items-center rounded-2xl ${active ? 'bg-brand/20 text-brand' : 'text-ink'}`}>
      {icon}
    </button>
  )
}
