import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, Trophy, Flame, CheckSquare } from 'lucide-react'
import { useStore } from '../lib/store'
import { useAuth, signOut } from '../lib/auth'
import { Card, Input, Button } from '../components/ui'

const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐨', '🦉', '🐧', '🐸', '🦄', '🐵']

export default function Profile() {
  const { profile, setProfile, engagement, tasks } = useStore()
  const { user } = useAuth()
  const nav = useNavigate()
  const done = tasks.filter((t) => t.done).length

  return (
    <div className="safe-top px-4 pb-6">
      <div className="flex items-center gap-3 py-4">
        <Link to="/" className="grid h-10 w-10 place-items-center rounded-2xl bg-card border border-line"><ArrowLeft size={18} /></Link>
        <h1 className="text-2xl font-extrabold">Profile</h1>
      </div>

      <Card className="flex flex-col items-center py-6">
        <div className="grid h-24 w-24 place-items-center rounded-3xl bg-brand/20 text-5xl">{profile.avatar}</div>
        <p className="mt-3 text-xl font-bold">{profile.displayName}</p>
        {profile.username && <p className="text-sm text-muted">@{profile.username}</p>}
        {profile.bio && <p className="mt-2 text-center text-sm text-muted">{profile.bio}</p>}
      </Card>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Card className="text-center"><Flame className="mx-auto text-orange-400" size={20} /><p className="mt-1 text-xl font-bold">{engagement.streak}</p><p className="text-xs text-muted">streak</p></Card>
        <Card className="text-center"><Trophy className="mx-auto text-amber-400" size={20} /><p className="mt-1 text-xl font-bold">{engagement.points}</p><p className="text-xs text-muted">points</p></Card>
        <Card className="text-center"><CheckSquare className="mx-auto text-emerald-400" size={20} /><p className="mt-1 text-xl font-bold">{done}</p><p className="text-xs text-muted">done</p></Card>
      </div>

      <h2 className="mt-5 mb-2 font-bold">Edit profile</h2>
      <Card className="space-y-3">
        <Input placeholder="Display name" value={profile.displayName} onChange={(e) => setProfile({ displayName: e.target.value })} />
        <Input placeholder="Username" value={profile.username} onChange={(e) => setProfile({ username: e.target.value })} />
        <Input placeholder="Bio" value={profile.bio} onChange={(e) => setProfile({ bio: e.target.value })} />
        <div>
          <p className="mb-2 text-sm text-muted">Avatar</p>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => setProfile({ avatar: a })} className={`grid h-11 w-11 place-items-center rounded-2xl text-2xl ${profile.avatar === a ? 'bg-brand/25 ring-2 ring-brand' : 'bg-surface'}`}>{a}</button>
            ))}
          </div>
        </div>
      </Card>

      <p className="mt-3 text-xs text-muted">Longest streak: {engagement.longestStreak} days · Streak freezes: {engagement.freezes}</p>

      {user && (
        <Button variant="danger" className="mt-5 w-full" onClick={async () => { await signOut(); nav('/') }}>
          <LogOut size={18} /> Sign out
        </Button>
      )}
    </div>
  )
}
