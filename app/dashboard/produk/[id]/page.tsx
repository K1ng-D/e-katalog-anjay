// app/produk/[id]/page.tsx  -- Detail Produk (login required)
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import UserNavbar from '@/components/UserNavbar'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowLeft, FiShoppingCart, FiShare2, FiHeart, FiClock, FiBox, FiShoppingBag, FiMessageCircle, FiGlobe } from 'react-icons/fi'

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

function fmtDate(ms?: number) {
  if (!ms) return '-'
  try {
    return new Date(ms).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

// Skeleton Loader
function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded animate-pulse w-full"></div>
        </div>
      </div>
    </div>
  )
}

export default function ProdukDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const docRef = useMemo(() => (id ? doc(db, 'products', id) : null), [id])
  const [activeImage, setActiveImage] = useState(0)

  const [item, setItem] = useState<(Product & { id: string }) | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!docRef) return
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setItem({ id: snap.id, ...(snap.data() as Product) })
        setLoading(false)
      },
      () => {
        setNotFound(true)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [docRef])

  if (loading) {
    return (
      <ProtectedRoute>
        <UserNavbar />
        <DetailSkeleton />
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <UserNavbar />
        
        {/* Header Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              <span className="mr-2"><FiArrowLeft /></span>
              Kembali
            </motion.button>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {notFound ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100"
            >
              <div className="text-gray-400 mb-4 mx-auto">
                <FiShoppingBag size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Produk Tidak Ditemukan</h2>
              <p className="text-gray-600 mb-6">Maaf, produk yang Anda cari tidak ditemukan dalam katalog.</p>
              <Link
                href="/produk"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-xl transition-colors inline-flex items-center"
              >
                <span className="mr-2"><FiArrowLeft /></span>
                Kembali ke Daftar Produk
              </Link>
            </motion.div>
          ) : item ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className="grid lg:grid-cols-2 gap-8"
            >
              {/* Gallery Section */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
                }}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
              >
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-4">
                  {item.images?.[activeImage] ? (
                    <img
                      src={item.images[activeImage]}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <FiShoppingBag size={48} />
                    </div>
                  )}
                </div>

                {item.images && item.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {item.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImage(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          activeImage === index
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${item.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Info Section */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: 20 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.2 } }
                }}
                className="space-y-6"
              >
                <div>
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-3">
                    {item.category || 'Produk'}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
                  <div className="text-3xl font-bold text-blue-700 mb-4">
                    Rp {Number(item.price || 0).toLocaleString('id-ID')}
                  </div>
                </div>

                {item.status && (
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'ready'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'habis'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      item.status === 'ready' ? 'bg-green-500' :
                      item.status === 'habis' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></div>
                    {item.status === 'ready' ? 'Tersedia' : 
                     item.status === 'habis' ? 'Habis' : 
                     item.status === 'active' ? 'Aktif' : 'Draft'}
                  </div>
                )}

                {typeof item.stock === 'number' && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2"><FiBox /></span>
                    <span>Stok: {item.stock} unit</span>
                  </div>
                )}

                {item.description && (
                  <div className="prose prose-gray max-w-none">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Deskripsi</h3>
                    <p className="text-gray-700 leading-relaxed">{item.description}</p>
                  </div>
                )}

               

                {/* Order Links */}
                {(item.links?.whatsapp || item.links?.shopee || item.links?.tokopedia || item.links?.website) && (
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Beli melalui:</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {item.links?.whatsapp && (
                        <a
                          href={item.links.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors text-green-800"
                        >
                          <span className="mb-2"><FiMessageCircle size={24} /></span>
                          <span className="text-sm font-medium">WhatsApp</span>
                        </a>
                      )}
                      {item.links?.shopee && (
                        <a
                          href={item.links.shopee}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors text-orange-800"
                        >
                          <span className="mb-2"><FiShoppingBag size={24} /></span>
                          <span className="text-sm font-medium">Shopee</span>
                        </a>
                      )}
                      {item.links?.tokopedia && (
                        <a
                          href={item.links.tokopedia}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors text-green-800"
                        >
                          <span className="mb-2"><FiShoppingBag size={24} /></span>
                          <span className="text-sm font-medium">Tokopedia</span>
                        </a>
                      )}
                      {item.links?.website && (
                        <a
                          href={item.links.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors text-gray-800"
                        >
                          <span className="mb-2"><FiGlobe size={24} /></span>
                          <span className="text-sm font-medium">Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span className="mr-2"><FiClock /></span>
                    <span>Dibuat: {fmtDate(item.createdAt)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2"><FiClock /></span>
                    <span>Diperbarui: {fmtDate(item.updatedAt)}</span>
                  </div>
                </div>

                {/* Back to list */}
                <div className="pt-6">
                  <Link
                    href="/dashboard/produk"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    <span className="mr-2"><FiArrowLeft /></span>
                    Kembali ke Daftar Produk
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">© {new Date().getFullYear()} E-Katalog Produk. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  )
}