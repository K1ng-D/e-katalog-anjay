import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { User } from 'firebase/auth'

export async function ensureUserProfile(user: User) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  const payload = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    role: 'user',
    status: 'active',
    updatedAt: Date.now(),
    createdAt: Date.now(),
  }
  if (!snap.exists()) {
    await setDoc(ref, payload)
  } else {
    await setDoc(ref, { ...payload, createdAt: snap.data()?.createdAt ?? Date.now() }, { merge: true })
  }
}
