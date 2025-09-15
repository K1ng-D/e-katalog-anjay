'use client'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import type { UserProfile } from '@/lib/types'

export type Session = {
user: User | null
profile: UserProfile | null
loading: boolean
}

const AuthContext = createContext<Session>({ user: null, profile: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
const [user, setUser] = useState<User | null>(null)
const [profile, setProfile] = useState<UserProfile | null>(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
const unsub = onAuthStateChanged(auth, async (u) => {
setUser(u)
if (u) {
const snap = await getDoc(doc(db, 'users', u.uid))
setProfile((snap.data() as UserProfile) ?? null)
} else {
setProfile(null)
}
setLoading(false)
})
return () => unsub()
}, [])

return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>
}

export const useSession = () => useContext(AuthContext)