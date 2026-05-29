// Realtime 1:1 chat over Firestore + media uploads to Firebase Storage.
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
  limit,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFb } from './firebase'

export type MsgKind = 'text' | 'image' | 'gif' | 'voice' | 'file'

export interface Message {
  id: string
  from: string
  kind: MsgKind
  text?: string
  mediaUrl?: string
  createdAt: number
}

export interface ChatUser {
  uid: string
  username: string
}

// A deterministic conversation id from two uids.
export function convId(a: string, b: string) {
  return [a, b].sort().join('__')
}

export async function findUserByUsername(username: string): Promise<ChatUser | null> {
  const fb = getFb()
  if (!fb) return null
  const q = query(
    collection(fb.db, 'users'),
    where('usernameLower', '==', username.toLowerCase().trim()),
    limit(1),
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0].data() as any
  return { uid: d.uid, username: d.username }
}

export async function ensureConversation(me: ChatUser, other: ChatUser) {
  const fb = getFb()
  if (!fb) return
  const id = convId(me.uid, other.uid)
  await setDoc(
    doc(fb.db, 'conversations', id),
    {
      members: [me.uid, other.uid],
      memberNames: { [me.uid]: me.username, [other.uid]: other.username },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  return id
}

export function listenConversations(uid: string, cb: (rows: any[]) => void) {
  const fb = getFb()
  if (!fb) return () => {}
  const q = query(
    collection(fb.db, 'conversations'),
    where('members', 'array-contains', uid),
    orderBy('updatedAt', 'desc'),
  )
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

export function listenMessages(cid: string, cb: (msgs: Message[]) => void) {
  const fb = getFb()
  if (!fb) return () => {}
  const q = query(
    collection(fb.db, 'conversations', cid, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(200),
  )
  return onSnapshot(q, (snap) =>
    cb(
      snap.docs.map((d) => {
        const data = d.data() as any
        return {
          id: d.id,
          from: data.from,
          kind: data.kind,
          text: data.text,
          mediaUrl: data.mediaUrl,
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        }
      }),
    ),
  )
}

export async function sendMessage(
  cid: string,
  from: string,
  payload: { kind: MsgKind; text?: string; mediaUrl?: string },
) {
  const fb = getFb()
  if (!fb) return
  await addDoc(collection(fb.db, 'conversations', cid, 'messages'), {
    from,
    ...payload,
    createdAt: serverTimestamp(),
  })
  await setDoc(
    doc(fb.db, 'conversations', cid),
    { updatedAt: serverTimestamp(), lastText: payload.text || `[${payload.kind}]` },
    { merge: true },
  )
}

export async function uploadMedia(cid: string, file: Blob, ext: string): Promise<string> {
  const fb = getFb()
  if (!fb) throw new Error('offline')
  const path = `chat/${cid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const r = ref(fb.storage, path)
  await uploadBytes(r, file)
  return getDownloadURL(r)
}
