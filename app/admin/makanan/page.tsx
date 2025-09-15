// app/admin/makanan/page.tsx  -- Management Makanan (CRUD, safe Firestore + Cloudinary API)
'use client'

import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminSidebar from '@/components/AdminSidebar'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Food } from '@/lib/types'
import CloudinaryUploadApiMulti from '@/components/CloudinaryMultiUpload'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiCoffee, 
  FiDollarSign, 
  FiBox, 
  FiImage, 
  FiLink, 
  FiEdit, 
  FiTrash2, 
  FiSave, 
  FiX,
  FiPlus,
  FiShoppingBag,
  FiTag,
  FiFileText,
  FiGrid,
  FiCheckCircle,
  FiAlertCircle,
  FiPower
} from 'react-icons/fi'

// ---- Utility: hapus semua undefined sebelum write ke Firestore ----
function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj
      .filter((v) => v !== undefined)
      .map((v) => (v && typeof v === 'object' ? stripUndefined(v as any) : v)) as any
  }
  if (obj && typeof obj === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(obj as any)) {
      if (v === undefined) continue
      out[k] = v && typeof v === 'object' ? stripUndefined(v as any) : v
    }
    return out
  }
  return obj
}

// ---- Default form state ----
const initialForm: Food = {
  name: '',
  foodCategory: 'makanan ringan',
  description: '',
  price: 0,
  weightGrams: 0,
  images: [],
  links: { whatsapp: '', shopee: '', tokopedia: '', website: '' },
  status: 'available',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

export default function MakananAdminPage() {
  const [items, setItems] = useState<(Food & { id: string })[]>([])
  const [form, setForm] = useState<Food>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const foodsRef = useMemo(() => collection(db, 'foods'), [])

  useEffect(() => {
    const q = query(foodsRef, orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Food) }))
      setItems(data)
      setLoading(false)
    })
    return () => unsub()
  }, [foodsRef])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isUploading) {
      alert('Tunggu upload gambar selesai dulu ya.')
      return
    }

    const payload = stripUndefined({
      ...form,
      images: form.images ?? [],
      foodCategory: form.foodCategory || 'makanan ringan',
      status: form.status || 'available',
      price: Number.isFinite(form.price) ? form.price : 0,
      weightGrams: Number.isFinite(form.weightGrams ?? 0) ? (form.weightGrams ?? 0) : 0,
      updatedAt: Date.now(),
      ...(editingId ? {} : { createdAt: Date.now() }),
    })

    try {
      if (editingId) {
        await updateDoc(doc(foodsRef, editingId), payload as any)
        setEditingId(null)
      } else {
        await addDoc(foodsRef, payload as any)
      }
      setForm(initialForm)
    } catch (error) {
      console.error('Error saving food:', error)
      alert('Terjadi kesalahan saat menyimpan makanan')
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus makanan ini?')) return
    await deleteDoc(doc(foodsRef, id))
  }

  function onEdit(item: Food & { id: string }) {
    setEditingId(item.id!)
    setForm({
      ...item,
      images: item.images ?? [],
      links: {
        whatsapp: '',
        shopee: '',
        tokopedia: '',
        website: '',
        ...(item.links || {}),
      },
      status: (item.status as Food['status']) ?? 'available',
      foodCategory: (item.foodCategory as Food['foodCategory']) ?? 'makanan ringan',
      price: Number.isFinite(item.price) ? item.price : 0,
      weightGrams: Number.isFinite(item.weightGrams ?? 0) ? (item.weightGrams ?? 0) : 0,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(initialForm)
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const foodCategories = [
    { value: 'makanan ringan', label: 'Makanan Ringan' },
    { value: 'makanan berat', label: 'Makanan Berat' },
    { value: 'minuman', label: 'Minuman' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'lainnya', label: 'Lainnya' },
  ]

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'soldout', label: 'Sold Out' },
    { value: 'draft', label: 'Draft' },
  ]

  return (
    <ProtectedRoute requireRole="admin">
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          {/* Header Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Management Makanan</h1>
              <p className="text-gray-600 mt-1">Kelola menu makanan Anda</p>
            </div>
            {editingId && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={cancelEdit}
                className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
              >
                <FiX className="mr-2" />
                Batalkan Edit
              </motion.button>
            )}
          </motion.div>

          {/* Form Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FiCoffee className="mr-2 text-orange-600" />
              {editingId ? 'Edit Makanan' : 'Tambah Makanan Baru'}
            </h2>
            
            <form onSubmit={onSubmit} className="grid lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiShoppingBag className="mr-2 text-gray-400" />
                    Nama Makanan
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Masukkan nama makanan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiTag className="mr-2 text-gray-400" />
                    Kategori Makanan
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={form.foodCategory}
                    onChange={(e) =>
                      setForm({ ...form, foodCategory: e.target.value as Food['foodCategory'] })
                    }
                  >
                    {foodCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiFileText className="mr-2 text-gray-400" />
                    Deskripsi
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-h-[100px]"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Deskripsi makanan..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FiDollarSign className="mr-2 text-gray-400" />
                      Harga
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={form.price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          price: e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FiPower className="mr-2 text-gray-400" />
                      Berat (gram)
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={form.weightGrams ?? 0}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          weightGrams: e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiCheckCircle className="mr-2 text-gray-400" />
                    Status
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Food['status'] })}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiImage className="mr-2 text-gray-400" />
                    Gambar Makanan
                  </label>
                  <CloudinaryUploadApiMulti
                    onUploaded={(urls) => setForm({ ...form, images: urls ?? [] })}
                    onUploadingChange={setIsUploading}
                  />
                  {form.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.images.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Preview ${index}`}
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiLink className="mr-2 text-gray-400" />
                    Link Pembelian
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">WhatsApp</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={form.links?.whatsapp || ''}
                        onChange={(e) =>
                          setForm({ ...form, links: { ...form.links, whatsapp: e.target.value } })
                        }
                        placeholder="https://wa.me/62…"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Website</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={form.links?.website || ''}
                        onChange={(e) =>
                          setForm({ ...form, links: { ...form.links, website: e.target.value } })
                        }
                        placeholder="https://website.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Shopee</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={form.links?.shopee || ''}
                        onChange={(e) =>
                          setForm({ ...form, links: { ...form.links, shopee: e.target.value } })
                        }
                        placeholder="https://shopee.co.id"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tokopedia</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={form.links?.tokopedia || ''}
                        onChange={(e) =>
                          setForm({ ...form, links: { ...form.links, tokopedia: e.target.value } })
                        }
                        placeholder="https://tokopedia.com"
                      />
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" />
                      {editingId ? 'Update Makanan' : 'Tambah Makanan'}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Foods Table */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiGrid className="mr-2 text-orange-600" />
                Daftar Makanan ({items.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Makanan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Berat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                    // Skeleton Loaders
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded"></div>
                            <div className="ml-3 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </td>
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <FiCoffee className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada makanan</h3>
                        <p className="text-gray-600">Mulai dengan menambahkan makanan pertama Anda</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {it.images?.[0] ? (
                              <img
                                src={it.images[0]}
                                alt={it.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <FiCoffee className="text-gray-400" />
                              </div>
                            )}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{it.name}</div>
                              <div className="text-xs text-gray-500 line-clamp-1">{it.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 capitalize">
                            {it.foodCategory}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Rp {Number(it.price || 0).toLocaleString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {it.weightGrams ? `${it.weightGrams}g` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            it.status === 'available' 
                              ? 'bg-green-100 text-green-800' 
                              : it.status === 'soldout'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {it.status === 'available' ? 'Available' : 
                             it.status === 'soldout' ? 'Sold Out' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onEdit(it)}
                              className="p-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                              title="Edit"
                            >
                              <FiEdit size={14} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onDelete(it.id!)}
                              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              title="Hapus"
                            >
                              <FiTrash2 size={14} />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  )
}