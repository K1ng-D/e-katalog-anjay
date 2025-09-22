// app/page.tsx  -- Homepage (wajib login; rekomendasi muncul segera setelah survey)
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useSession } from '@/components/providers/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { tfidfRank } from '@/lib/reco'
import type { Product as TProduct, Food as TFood, UserProfile } from '@/lib/types'
import UserNavbar from '@/components/UserNavbar'
import { motion, type Variants } from "framer-motion";
import { FiArrowRight, FiStar, FiClock, FiTrendingUp, FiSearch, FiShoppingBag, FiCoffee, FiHeart, FiChevronRight } from 'react-icons/fi'
import { IconContext } from 'react-icons'

type Product = Omit<TProduct, 'id'> & { id: string }
type Food = Omit<TFood, 'id'> & { id: string }

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

// UI helpers
function Section({ 
    title, 
    icon: Icon, 
    children, 
    viewAllLink,
    description
  }: { 
    title: string
    icon?: React.ElementType
    children: React.ReactNode
    viewAllLink?: string
    description?: string
  }) {
    return (
      <section className="mb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {Icon && (
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white shadow-lg">
                  <Icon size={20} />
                </div>
              )}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
            </div>
            {description && <p className="text-gray-600 max-w-2xl">{description}</p>}
          </div>
          {viewAllLink && (
            <Link 
              href={viewAllLink}
              className="hidden md:flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors group"
            >
              Lihat semua
              <span className="ml-1 group-hover:translate-x-1 transition-transform">
                <FiChevronRight />
              </span>
            </Link>
          )}
        </div>
        {children}
        {viewAllLink && (
          <div className="mt-6 md:hidden">
            <Link 
              href={viewAllLink}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Lihat semua <span className="ml-1"><FiChevronRight /></span>
            </Link>
          </div>
        )}
      </section>
    )
  }

function Card({
  href,
  img,
  overline,
  title,
  subtitle,
  isNew,
}: {
  href: string
  img?: string
  overline?: string
  title: string
  subtitle?: string
  isNew?: boolean
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Link href={href} className="block h-full">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
            {img ? (
              <img 
                src={img} 
                alt={title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                loading="lazy" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="text-gray-400 text-xs">No image</div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {overline && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                {overline}
              </div>
            )}
            
            {isNew && (
              <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Baru
              </div>
            )}
            
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white rounded-full p-2 shadow-md text-gray-600">
                <FiHeart size={16} />
              </div>
            </div>
          </div>
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
            {subtitle && (
              <div className="text-lg font-bold text-blue-700 mt-auto">
                {subtitle}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// baca tokens dari sessionStorage (fallback setelah survey)
function readSessionTokens(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem('prefsTokens')
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

// Category chips for filtering
const CATEGORIES = [
  { id: 'all', name: 'Semua', icon: FiShoppingBag },
  { id: 'food', name: 'Makanan', icon: FiCoffee },
  { id: 'product', name: 'Produk', icon: FiShoppingBag },
];

export default function HomePage() {
  const { profile } = useSession() as { profile: UserProfile | null }
  const [activeCategory, setActiveCategory] = useState('all');

  const productsRef = useMemo(() => collection(db, 'products'), [])
  const foodsRef = useMemo(() => collection(db, 'foods'), [])

  const [latestProducts, setLatestProducts] = useState<Product[]>([])
  const [latestFoods, setLatestFoods] = useState<Food[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [allFoods, setAllFoods] = useState<Food[]>([])

  // Terbaru
  useEffect(() => {
    const unsub1 = onSnapshot(
      query(productsRef, orderBy('createdAt', 'desc'), limit(8)),
      (snap) => setLatestProducts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TProduct) })))
    )
    const unsub2 = onSnapshot(
      query(foodsRef, orderBy('createdAt', 'desc'), limit(8)),
      (snap) => setLatestFoods(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TFood) })))
    )
    return () => {
      unsub1()
      unsub2()
    }
  }, [productsRef, foodsRef])

  // Data untuk rekomendasi (ambil lebih banyak)
  useEffect(() => {
    const unsub1 = onSnapshot(
      query(productsRef, orderBy('createdAt', 'desc'), limit(50)),
      (snap) => setAllProducts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TProduct) })))
    )
    const unsub2 = onSnapshot(
      query(foodsRef, orderBy('createdAt', 'desc'), limit(50)),
      (snap) => setAllFoods(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TFood) })))
    )
    return () => {
      unsub1()
      unsub2()
    }
  }, [productsRef, foodsRef])

  // Build tokens dari preferensi user (gabung profile + session cache)
  const prefTokens = useMemo(() => {
    const fromProfile = [
      ...(profile?.preferences?.productCategories ?? []),
      ...(profile?.preferences?.foodCategories ?? []),
      ...(profile?.preferences?.likedKeywords ?? []),
    ].map((t) => t.toLowerCase())

    const fromSession = readSessionTokens()
    const merged = Array.from(new Set([...fromProfile, ...fromSession].filter(Boolean)))
    return merged
  }, [profile?.preferences])

  // Bersihkan cache prefsTokens jika profile sudah confirmed surveyCompleted
  useEffect(() => {
    if (profile?.surveyCompleted && typeof window !== 'undefined') {
      sessionStorage.removeItem('prefsTokens')
    }
  }, [profile?.surveyCompleted])

  // TF-IDF ranking untuk produk & makanan (lowercase untuk stabilitas)
  const recoProductIds = useMemo(() => {
    if (!prefTokens.length || !allProducts.length) return []
    const docs = allProducts.map((p) => ({
      id: p.id,
      text: [p.name, p.description, p.category].filter(Boolean).join(' ').toLowerCase(),
    }))
    return tfidfRank(docs, prefTokens, 8)
  }, [prefTokens, allProducts])

  const recoFoodIds = useMemo(() => {
    if (!prefTokens.length || !allFoods.length) return []
    const docs = allFoods.map((f) => ({
      id: f.id,
      text: [f.name, f.description, f.foodCategory].filter(Boolean).join(' ').toLowerCase(),
    }))
    return tfidfRank(docs, prefTokens, 8)
  }, [prefTokens, allFoods])

  const recoProducts = recoProductIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean) as Product[]

  const recoFoods = recoFoodIds
    .map((id) => allFoods.find((f) => f.id === id))
    .filter(Boolean) as Food[]

  return (
    // ✅ Wajib login, tapi halaman ini tidak dipaksa survey
    <ProtectedRoute requireSurvey={false}>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <UserNavbar />

        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/10 z-0"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 relative z-10">
            <div className="grid md:grid-cols-1 gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                  Temukan Kebutuhan <span className="text-yellow-300">Terbaik</span> Anda
                </h1>
                <p className="text-xl md:text-2xl opacity-90 mb-8">
                  E-Katalog dengan rekomendasi personal untuk produk dan makanan favorit Anda
                  </p>
           
              </motion.div>
              
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex space-x-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === category.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'}`}
                >
                  <IconContext.Provider value={{ className: "mr-2" }}>
                    <category.icon size={16} />
                  </IconContext.Provider>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Rekomendasi: tampil jika ada tokens (dari profile ATAU session) */}
          {prefTokens.length > 0 && (recoProducts.length > 0 || recoFoods.length > 0) && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {recoProducts.length > 0 && (activeCategory === 'all' || activeCategory === 'product') && (
                <Section 
                  title="Rekomendasi Produk" 
                  icon={FiStar} 
                  viewAllLink="/produk"
                  description="Berdasarkan preferensi dan riwayat pencarian Anda"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {recoProducts.map((p) => (
                      <Card
                        key={p.id}
                        href={`/produk/${p.id}`}
                        img={p.images?.[0]}
                        overline={(p.category || 'lainnya').toUpperCase()}
                        title={p.name}
                        subtitle={`Rp ${Number(p.price || 0).toLocaleString('id-ID')}`}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {recoFoods.length > 0 && (activeCategory === 'all' || activeCategory === 'food') && (
                <Section 
                  title="Rekomendasi Makanan" 
                  icon={FiStar} 
                  viewAllLink="/makanan"
                  description="Menu pilihan yang mungkin Anda sukai"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {recoFoods.map((f) => (
                      <Card
                        key={f.id}
                        href={`/makanan/${f.id}`}
                        img={f.images?.[0]}
                        overline={(f.foodCategory || 'lainnya').toUpperCase()}
                        title={f.name}
                        subtitle={`Rp ${Number(f.price || 0).toLocaleString('id-ID')}`}
                      />
                    ))}
                  </div>
                </Section>
              )}
            </motion.div>
          )}

          {/* Produk Terbaru */}
          {(activeCategory === 'all' || activeCategory === 'product') && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.3 }}
            >
              <Section 
                title="Produk Terbaru" 
                icon={FiClock} 
                viewAllLink="/produk"
                description="Produk baru yang baru saja ditambahkan"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {latestProducts.length > 0 ? (
                    latestProducts.map((p) => (
                      <Card
                        key={p.id}
                        href={`/produk/${p.id}`}
                        img={p.images?.[0]}
                        overline={(p.category || 'lainnya').toUpperCase()}
                        title={p.name}
                        subtitle={`Rp ${Number(p.price || 0).toLocaleString('id-ID')}`}
                        isNew={true}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-16">
                      <div className="text-gray-400 text-lg">Belum ada produk tersedia.</div>
                      <Link href="/produk" className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium">
                        Jelajahi semua produk
                      </Link>
                    </div>
                  )}
                </div>
              </Section>
            </motion.div>
          )}

          {/* Makanan Terbaru */}
          {(activeCategory === 'all' || activeCategory === 'food') && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.5 }}
            >
              <Section 
                title="Makanan Terbaru" 
                icon={FiTrendingUp} 
                viewAllLink="/makanan"
                description="Menu terbaru yang siap memanjakan lidah Anda"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {latestFoods.length > 0 ? (
                    latestFoods.map((f) => (
                      <Card
                        key={f.id}
                        href={`/makanan/${f.id}`}
                        img={f.images?.[0]}
                        overline={(f.foodCategory || 'lainnya').toUpperCase()}
                        title={f.name}
                        subtitle={`Rp ${Number(f.price || 0).toLocaleString('id-ID')}`}
                        isNew={true}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-16">
                      <div className="text-gray-400 text-lg">Belum ada makanan tersedia.</div>
                      <Link href="/makanan" className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium">
                        Jelajahi semua makanan
                      </Link>
                    </div>
                  )}
                </div>
              </Section>
            </motion.div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16 mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tidak menemukan yang Anda cari?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
              Jelajahi katalog lengkap kami untuk menemukan lebih banyak produk dan makanan menarik.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/dashboard/produk" 
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-xl transition-colors shadow-lg flex items-center justify-center"
              >
                Lihat Semua Produk <span className="ml-2"><FiChevronRight /></span>
              </Link>
              <Link 
                href="/dashboard/makanan" 
                className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-semibold py-3 px-8 rounded-xl transition-colors shadow-lg flex items-center justify-center"
              >
                Lihat Semua Makanan <span className="ml-2"><FiChevronRight /></span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">E-Katalog</h3>
                <p className="text-gray-400">
                  Temukan produk dan makanan terbaik dengan rekomendasi personal untuk pengalaman berbelanja yang lebih baik.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Tautan Cepat</h4>
                <ul className="space-y-2">
                  <li><Link href="/dashboard/produk" className="text-gray-400 hover:text-white transition-colors">Produk</Link></li>
                  <li><Link href="/dashboard/makanan" className="text-gray-400 hover:text-white transition-colors">Makanan</Link></li>
             
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Hubungi Kami</h4>
                <p className="text-gray-400 mb-2">email@example.com</p>
                <p className="text-gray-400">+62 123 456 7890</p>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>© {new Date().getFullYear()} LADUNIMART. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </ProtectedRoute>
  )
}