// app/dashboard/makanan/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import UserNavbar from '@/components/UserNavbar'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { FiSearch, FiFilter, FiCoffee } from 'react-icons/fi'
import { IconContext } from 'react-icons'

type Food = {
  name: string
  foodCategory?: string
  description?: string
  price: number
  weightGrams?: number
  images?: string[]
  links?: { whatsapp?: string; shopee?: string; tokopedia?: string; website?: string }
  status?: 'available' | 'soldout' | 'draft'
  createdAt?: number
  updatedAt?: number
}

// Animation variants (with proper typing)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const, // <— penting supaya bukan string biasa
      stiffness: 100,
      damping: 15,
    },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

// Skeleton Loader
function FoodCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm h-full flex flex-col animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 flex flex-col flex-grow space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-5 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-auto" />
      </div>
    </div>
  )
}

// Food Card
function FoodCard({ food }: { food: Food & { id: string } }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="h-full">
      <Link href={`/dashboard/makanan/${food.id}`}>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
            {food.images?.[0] ? (
              // pakai <img> biasa agar simpel; bisa ganti ke next/image bila mau
              <img
                src={food.images[0]}
                alt={food.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <IconContext.Provider value={{ className: 'text-gray-400' }}>
                  <FiCoffee size={32} />
                </IconContext.Provider>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {food.foodCategory && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                {food.foodCategory.toUpperCase()}
              </div>
            )}

            {food.status && (
              <div
                className={`absolute top-3 right-3 text-white px-2 py-1 rounded-full text-xs font-medium ${
                  food.status === 'available'
                    ? 'bg-green-500'
                    : food.status === 'soldout'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}
              >
                {food.status}
              </div>
            )}

           
          </div>

          <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
              {food.name}
            </h3>

            {food.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-grow">{food.description}</p>
            )}

            <div className="flex items-center justify-between mt-auto">
              <div className="text-lg font-bold text-blue-700">
                Rp {Number(food.price || 0).toLocaleString('id-ID')}
              </div>
              {typeof food.weightGrams === 'number' && (
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{food.weightGrams}g</div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function MakananPage() {
  const foodsRef = useMemo(() => collection(db, 'foods'), [])
  const [items, setItems] = useState<(Food & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('semua')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const qy = query(foodsRef, orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(qy, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Food) })))
      setLoading(false)
    })
    return () => unsub()
  }, [foodsRef])

  const allCategories = Array.from(
    new Set(items.map((i) => (i.foodCategory?.trim() || 'lainnya').toLowerCase()))
  ).sort((a, b) => a.localeCompare(b))

  const filtered = items.filter((it) => {
    const catOk = category === 'semua' || (it.foodCategory || 'lainnya').toLowerCase() === category
    const q = search.trim().toLowerCase()
    const qOk =
      !q ||
      it.name?.toLowerCase().includes(q) ||
      it.foodCategory?.toLowerCase().includes(q) ||
      it.description?.toLowerCase().includes(q)
    return catOk && qOk
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <UserNavbar />

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold mb-4">
                Katalog Makanan
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl opacity-90 max-w-2xl mx-auto"
              >
                Temukan berbagai pilihan makanan lezat dengan kualitas terbaik
              </motion.p>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                {/* Search */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconContext.Provider value={{ className: 'text-gray-400' }}>
                      <FiSearch size={20} />
                    </IconContext.Provider>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari makanan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconContext.Provider value={{ className: 'text-gray-400' }}>
                      <FiFilter size={20} />
                    </IconContext.Provider>
                  </div>
                  <select
                    className="pl-10 pr-8 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    onChange={(e) => setCategory(e.target.value)}
                    value={category}
                  >
                    <option value="semua">Semua Kategori</option>
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Result count */}
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-6">
            <p className="text-gray-600">
              Menampilkan <span className="font-semibold text-gray-900">{filtered.length}</span> makanan
              {category !== 'semua' && ` dalam kategori "${category}"`}
              {search && ` untuk pencarian "${search}"`}
            </p>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <FoodCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
              <div className="text-gray-400 mb-4">
                <IconContext.Provider value={{ className: 'mx-auto' }}>
                  <FiCoffee size={48} />
                </IconContext.Provider>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada makanan yang ditemukan</h3>
              <p className="text-gray-600 mb-6">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
              <button
                onClick={() => {
                  setSearch('')
                  setCategory('semua')
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-xl transition-colors"
              >
                Reset Filter
              </button>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <AnimatePresence>
                {filtered.map((food) => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">© {new Date().getFullYear()} E-Katalog Makanan. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  )
}
