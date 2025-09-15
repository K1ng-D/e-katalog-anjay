// app/admin/login/page.tsx
'use client'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', user.uid))
      const role = snap.data()?.role
      if (role !== 'admin') throw new Error('Not an admin account')
      router.push(`/admin/${user.uid}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">Login Admin</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Admin email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          required
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          disabled={loading}
          className="w-full bg-gray-900 text-white rounded p-2"
        >
          {loading ? 'Loading…' : 'Login as Admin'}
        </button>
      </form>
    </main>
  )
}
