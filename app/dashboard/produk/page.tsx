// app/produk/page.tsx  -- List Produk (login required, filter kategori)
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import UserNavbar from '@/components/UserNavbar'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiFilter, FiShoppingBag } from 'react-icons/fi'

type Product = {
  name: string
  category: string
  description?: string
  price: number
  images?: string[]
  links?: { whatsapp?: string; shopee?: string; tokopedia?: string; website?: string }
  stock?: number
  status?: 'ready' | 'habis' | 'active' | 'draft'
  createdAt?: number
  updatedAt?: number
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 }
  }
}

// Skeleton Loader Component
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm h-full flex flex-col animate-pulse">
      <div className="aspect-square bg-gray-200"></div>
      <div className="p-4 flex flex-col flex-grow space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-5 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-auto"></div>
      </div>
    </div>
  )
}

// Product Card Component
function ProductCard({ product }: { product: Product & { id: string } }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Link href={`/dashboard/produk/${product.id}`}>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
            {product.images?.[0] ? (
              <img 
                src={product.images[0]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                loading="lazy" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <span className="text-gray-400"><FiShoppingBag size={32} /></span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {product.category && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                {product.category.toUpperCase()}
              </div>
            )}
            
            {product.status && (
              <div className={`absolute top-3 right-3 text-white px-2 py-1 rounded-full text-xs font-medium ${
                product.status === 'ready' ? 'bg-green-500' :
                product.status === 'habis' ? 'bg-red-500' :
                'bg-gray-500'
              }`}>
                {product.status === 'ready' ? 'Tersedia' : 
                 product.status === 'habis' ? 'Habis' : 
                 product.status}
              </div>
            )}
            
           
          </div>
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-grow">
                {product.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-auto">
              <div className="text-lg font-bold text-blue-700">
                Rp {Number(product.price || 0).toLocaleString('id-ID')}
              </div>
              {typeof product.stock === 'number' && (
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Stok: {product.stock}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function ProdukPage() {
  const productsRef = useMemo(() => collection(db, 'products'), [])
  const [items, setItems] = useState<(Product & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('semua')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const qy = query(productsRef, orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(qy, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Product) }))
      setItems(data)
      setLoading(false)
    })
    return () => unsub()
  }, [productsRef])

  const allCategories = Array.from(
    new Set(items.map((i) => (i.category?.trim() || 'lainnya').toLowerCase()))
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  const filtered = items.filter((it) => {
    const catOk = category === 'semua' || (it.category || 'lainnya').toLowerCase() === category
    const q = search.trim().toLowerCase()
    const qOk =
      !q ||
      it.name?.toLowerCase().includes(q) ||
      it.category?.toLowerCase().includes(q) ||
      it.description?.toLowerCase().includes(q)
    return catOk && qOk
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <UserNavbar />
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold mb-4"
              >
                Katalog Produk
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl opacity-90 max-w-2xl mx-auto"
              >
                Temukan berbagai pilihan produk berkualitas dengan harga terbaik
              </motion.p>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Section */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Filter Produk</h2>
                <p className="text-gray-600">Temukan produk yang sesuai dengan kebutuhan Anda</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400"><FiSearch size={20} /></span>
                  </div>
                  <input
                    type="text"
                    className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cari produk…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400"><FiFilter size={20} /></span>
                  </div>
                  <select
                    className="pl-10 pr-8 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
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

          {/* Results Count */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="mb-6"
          >
            <p className="text-gray-600">
              Menampilkan <span className="font-semibold text-gray-900">{filtered.length}</span> produk
              {category !== 'semua' && ` dalam kategori "${category}"`}
              {search && ` untuk pencarian "${search}"`}
            </p>
          </motion.div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100"
            >
              <div className="text-gray-400 mb-4">
                <span className="mx-auto"><FiShoppingBag size={48} /></span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada produk yang ditemukan</h3>
              <p className="text-gray-600 mb-6">
                {search || category !== 'semua' 
                  ? 'Coba ubah filter pencarian atau kategori untuk melihat lebih banyak hasil.' 
                  : 'Belum ada produk yang tersedia dalam katalog.'}
              </p>
              {(search || category !== 'semua') && (
                <button 
                  onClick={() => { setSearch(''); setCategory('semua'); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-xl transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">© {new Date().getFullYear()} E-Katalog Produk. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  )
}