import React from 'react'

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'soft' | 'danger'
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-50'
  const variants = {
    primary: 'bg-brand text-white shadow-glow',
    soft: 'bg-brand/15 text-brand',
    ghost: 'bg-card text-ink border border-line',
    danger: 'bg-rose-500/15 text-rose-400',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Card({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl2 bg-card border border-line/60 p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Bottom sheet modal — used across the app for create/edit flows.
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 animate-fade-up" />
      <div
        className="relative w-full max-w-md glass rounded-t-3xl border-t border-line p-5 safe-bottom animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted/40" />
        {title && <h3 className="mb-4 text-lg font-bold">{title}</h3>}
        {children}
      </div>
    </div>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl bg-surface border border-line px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-brand ${props.className || ''}`}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl bg-surface border border-line px-4 py-3 text-ink outline-none placeholder:text-muted focus:border-brand ${props.className || ''}`}
    />
  )
}

export function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-brand/10 text-brand">{icon}</div>
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-muted">{hint}</p>}
    </div>
  )
}
