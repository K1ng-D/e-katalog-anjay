// app/survey/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/components/providers/AuthProvider'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { UserProfile } from '@/lib/types'

const PRODUCT_CATS = ['pakaian', 'aksesoris', 'elektronik', 'kecantikan', 'rumah tangga', 'lainnya']
const FOOD_CATS = ['makanan ringan', 'makanan berat', 'minuman', 'dessert', 'lainnya']

export default function SurveyPage() {
  const { user, profile } = useSession() as {
    user: { uid: string } | null
    profile: UserProfile | null
  }
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/dashboard/home'

  const [productCats, setProductCats] = useState<string[]>([])
  const [foodCats, setFoodCats] = useState<string[]>([])
  const [keywords, setKeywords] = useState('')
  const [saving, setSaving] = useState(false)

  // Jika sudah pernah isi survey, langsung lempar ke next
  useEffect(() => {
    if (profile?.surveyCompleted) {
      router.replace(next)
    }
  }, [profile?.surveyCompleted, next, router])

  // Load preferensi awal bila ada
  useEffect(() => {
    const uid = user?.uid
    if (!uid) return
    async function load(u: string) {
      const ref = doc(db, 'users', u)
      const snap = await getDoc(ref)
      const data = (snap.data() as any) || {}
      setProductCats(data.preferences?.productCategories || [])
      setFoodCats(data.preferences?.foodCategories || [])
      setKeywords((data.preferences?.likedKeywords || []).join(', '))
    }
    load(uid)
  }, [user?.uid])

  function toggle(arr: string[], v: string, setArr: (a: string[]) => void) {
    if (arr.includes(v)) setArr(arr.filter((x) => x !== v))
    else setArr([...arr, v])
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const uid = user?.uid
    if (!uid) return

    setSaving(true)
    try {
      const ref = doc(db, 'users', uid)
      const liked = keywords
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        preferences: {
          productCategories: productCats,
          foodCategories: foodCats,
          likedKeywords: liked,
        },
        surveyCompleted: true,
        updatedAt: Date.now(),
      }

      await setDoc(ref, payload, { merge: true })

      // ✅ simpan flag bypass & tokens agar rekomendasi langsung jalan,
      //    dan gate dashboard tidak mendorong balik ke /survey di navigasi berikutnya
      if (typeof window !== 'undefined') {
        const tokens = [...productCats, ...foodCats, ...liked]
          .map((t) => t.toLowerCase())
          .filter(Boolean)
        sessionStorage.setItem('surveyDone', '1')                 // bypass ProtectedRoute sementara
        sessionStorage.setItem('prefsTokens', JSON.stringify(tokens)) // rekomendasi awal
      }

      // (opsional) kalau AuthProvider punya setter, bisa optimistic update:
      // setProfile?.(prev => prev ? {
      //   ...prev,
      //   surveyCompleted: true,
      //   preferences: payload.preferences,
      //   updatedAt: Date.now(),
      // } : prev)

      // langsung ke dashboard home
      router.replace('/dashboard/home')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Preferensi Anda</h1>
      <p className="text-gray-600">Isi sebentar ya—biar rekomendasi pas selera.</p>

      <form onSubmit={onSubmit} className="space-y-6 bg-white p-4 rounded-2xl shadow">
        <section>
          <h2 className="font-semibold mb-2">Kategori Produk Favorit</h2>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggle(productCats, c, setProductCats)}
                className={`px-3 py-1 rounded border ${
                  productCats.includes(c) ? 'bg-black text-white' : 'bg-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Kategori Makanan Favorit</h2>
          <div className="flex flex-wrap gap-2">
            {FOOD_CATS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggle(foodCats, c, setFoodCats)}
                className={`px-3 py-1 rounded border ${
                  foodCats.includes(c) ? 'bg-black text-white' : 'bg-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Kata Kunci yang Anda Suka</h2>
          <input
            className="w-full border p-2 rounded"
            placeholder="contoh: manis, pedas, kopi, sepatu, skincare"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Pisahkan dengan spasi atau koma.</p>
        </section>

        <button className="px-4 py-2 bg-black text-white rounded disabled:opacity-50" disabled={saving}>
          {saving ? 'Menyimpan…' : 'Simpan & Lanjutkan'}
        </button>
      </form>
    </main>
  )
}
