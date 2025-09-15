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
import { db, auth } from '@/lib/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiUser, 
  FiMail, 
  FiImage, 
  FiEdit, 
  FiTrash2, 
  FiKey, 
  FiSave, 
  FiX,
  FiPlus,
  FiSearch,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiFrown,
  FiUsers,
  FiEye,
  FiEyeOff
} from 'react-icons/fi'
import { IconContext } from 'react-icons'

type UserRole = 'user' | 'admin'
type UserStatus = 'active' | 'disabled'
type UserProfile = {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  role: UserRole
  status: UserStatus
  createdAt: number
  updatedAt: number
}

function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj
      .filter(v => v !== undefined)
      .map(v => (v && typeof v === 'object' ? stripUndefined(v as any) : v)) as any
  }
  if (obj && typeof obj === 'object' && obj !== null) {
    const out: any = {}
    for (const [k, v] of Object.entries(obj as any)) {
      if (v === undefined) continue
      out[k] = v && typeof v === 'object' ? stripUndefined(v as any) : v
    }
    return out
  }
  return obj
}

export default function UsersAdminPage() {
  const usersRef = useMemo(() => collection(db, 'users'), [])
  const [items, setItems] = useState<(UserProfile & { id: string })[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [drafts, setDrafts] = useState<Record<string, Partial<UserProfile>>>({})
  const [addingRow, setAddingRow] = useState<boolean>(false)
  const [addDraft, setAddDraft] = useState<Partial<UserProfile>>({
    uid: '',
    email: '',
    displayName: '',
    photoURL: '',
    role: 'user',
    status: 'active',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(usersRef, orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as UserProfile) }))
      setItems(data)
      setLoading(false)
    })
    return () => unsub()
  }, [usersRef])

  // Helpers inline edit
  function startEdit(id: string, it: UserProfile) {
    setEditing(prev => ({ ...prev, [id]: true }))
    setDrafts(prev => ({
      ...prev,
      [id]: {
        uid: it.uid,
        email: it.email,
        displayName: it.displayName ?? '',
        photoURL: it.photoURL ?? '',
        role: it.role,
        status: it.status,
      },
    }))
  }

  function cancelEdit(id: string) {
    setEditing(prev => ({ ...prev, [id]: false }))
    setDrafts(prev => {
      const c = { ...prev }
      delete c[id]
      return c
    })
  }

  async function saveEdit(id: string) {
    const d = drafts[id]
    if (!d) return
    const now = Date.now()
    const payload = stripUndefined({
      ...d,
      email: d.email?.trim().toLowerCase(),
      uid: d.uid?.trim(),
      displayName: (d.displayName ?? '').trim(),
      photoURL: (d.photoURL ?? '').trim(),
      updatedAt: now,
    })
    if (!payload.uid || !payload.email) {
      alert('UID dan Email wajib diisi.')
      return
    }
    await updateDoc(doc(usersRef, id), payload as any)
    cancelEdit(id)
  }

  async function remove(id: string) {
    if (!confirm('Hapus dokumen profil user ini?')) return
    await deleteDoc(doc(usersRef, id))
  }

  async function toggleRole(it: UserProfile & { id: string }) {
    const next: UserRole = it.role === 'admin' ? 'user' : 'admin'
    await updateDoc(doc(usersRef, it.id), { role: next, updatedAt: Date.now() } as any)
  }

  async function toggleStatus(it: UserProfile & { id: string }) {
    const next: UserStatus = it.status === 'active' ? 'disabled' : 'active'
    await updateDoc(doc(usersRef, it.id), { status: next, updatedAt: Date.now() } as any)
  }

  async function sendReset(email: string) {
    if (!email) return alert('Email tidak tersedia.')
    try {
      await sendPasswordResetEmail(auth, email)
      alert('Email reset password sudah dikirim.')
    } catch (e: any) {
      alert('Gagal kirim reset password: ' + (e?.message || 'unknown error'))
    }
  }

  // Add row
  function cancelAdd() {
    setAddingRow(false)
    setAddDraft({ uid: '', email: '', displayName: '', photoURL: '', role: 'user', status: 'active' })
  }

  async function saveAdd() {
    const now = Date.now()
    const payload = stripUndefined({
      uid: addDraft.uid?.trim(),
      email: addDraft.email?.trim().toLowerCase(),
      displayName: (addDraft.displayName ?? '').trim(),
      photoURL: (addDraft.photoURL ?? '').trim(),
      role: (addDraft.role as UserRole) || 'user',
      status: (addDraft.status as UserStatus) || 'active',
      createdAt: now,
      updatedAt: now,
    })
    if (!payload.uid || !payload.email) {
      alert('UID dan Email wajib diisi.')
      return
    }
    await addDoc(usersRef, payload as any)
    cancelAdd()
  }

  const filtered = items.filter((it) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      it.email?.toLowerCase().includes(q) ||
      it.displayName?.toLowerCase().includes(q) ||
      it.uid?.toLowerCase().includes(q)
    )
  })

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

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
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Kelola semua pengguna sistem</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FiSearch />
                </div>
                <input
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  placeholder="Cari email/nama/UID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setAddingRow(true)}
                disabled={addingRow}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                title="Tambah dokumen profil user (Firestore)"
              >
                <IconContext.Provider value={{ className: "mr-2" }}>
                  <FiPlus />
                </IconContext.Provider>
                Tambah User
              </motion.button>
            </div>
          </motion.div>

          {/* Table Container */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {/* Add New User Row */}
                  <AnimatePresence>
                    {addingRow && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-blue-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap" colSpan={6}>
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                              <IconContext.Provider value={{ className: "mr-2" }}>
                                <FiUser />
                              </IconContext.Provider>
                              Tambah User Baru
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">UID</label>
                                <input
                                  placeholder="Auth UID"
                                  value={addDraft.uid ?? ''}
                                  onChange={(e) => setAddDraft(d => ({ ...d, uid: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  placeholder="email@example.com"
                                  type="email"
                                  value={addDraft.email ?? ''}
                                  onChange={(e) => setAddDraft(d => ({ ...d, email: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  placeholder="Display name"
                                  value={addDraft.displayName ?? ''}
                                  onChange={(e) => setAddDraft(d => ({ ...d, displayName: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Foto URL</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  placeholder="https://photo.url"
                                  value={addDraft.photoURL ?? ''}
                                  onChange={(e) => setAddDraft(d => ({ ...d, photoURL: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                <select
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  value={(addDraft.role as UserRole) ?? 'user'}
                                  onChange={(e) => setAddDraft(d => ({ ...d, role: e.target.value as UserRole }))}
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  value={(addDraft.status as UserStatus) ?? 'active'}
                                  onChange={(e) => setAddDraft(d => ({ ...d, status: e.target.value as UserStatus }))}
                                 
                                >
                                  <option value="active">Active</option>
                                  <option value="disabled">Disabled</option>
                                </select>
                              </div>
                            <div className="flex items-center justify-end space-x-3 pt-4">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={saveAdd}
                                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                              >
                                <IconContext.Provider value={{ className: "mr-2" }}>
                                  <FiSave />
                                </IconContext.Provider>
                                Simpan
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={cancelAdd}
                                className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                              >
                                <IconContext.Provider value={{ className: "mr-2" }}>
                                  <FiX />
                                </IconContext.Provider>
                                Batal
                              </motion.button>
                            </div>
                          </div>
                          </div>
                        </td>
                      </motion.tr>
                      
                    )}
                    </AnimatePresence>

                  {/* Loading State */}
                  {loading && (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                              <div className="ml-3 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-40"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-8 bg-gray-200 rounded w-24"></div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                 {/* Empty State */}
{!loading && filtered.length === 0 && (
  <tr>
    <td colSpan={6} className="px-6 py-12 text-center">
      <IconContext.Provider value={{ className: "mx-auto text-gray-400 mb-4" }}>
        <FiUsers size={48} />
      </IconContext.Provider>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada user</h3>
      <p className="text-gray-600">Mulai dengan menambahkan user pertama Anda</p>
    </td>
  </tr>
)}


                  {/* Users Rows */}
                  {filtered.map((it) => {
                    const isEdit = editing[it.id]
                    const d = drafts[it.id] || {}
                    
                    return (
                      <motion.tr
                        key={it.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* User Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEdit ? (
                            <input
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Display Name"
                              value={d.displayName ?? ''}
                              onChange={(e) => setDrafts(prev => ({ ...prev, [it.id]: { ...d, displayName: e.target.value } }))}
                            />
                          ) : (
                            <div className="flex items-center">
                              {it.photoURL ? (
                                <img
                                  src={it.photoURL}
                                  alt={it.displayName || it.email}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {it.displayName?.[0]?.toUpperCase() || it.email?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {it.displayName || 'No Name'}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEdit ? (
                            <input
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Email"
                              type="email"
                              value={d.email ?? ''}
                              onChange={(e) => setDrafts(prev => ({ ...prev, [it.id]: { ...d, email: e.target.value } }))}
                            />
                          ) : (
                            <div className="text-sm text-gray-900">{it.email}</div>
                          )}
                        </td>

                        {/* UID */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEdit ? (
                            <input
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                              placeholder="UID"
                              value={d.uid ?? ''}
                              onChange={(e) => setDrafts(prev => ({ ...prev, [it.id]: { ...d, uid: e.target.value } }))}
                            />
                          ) : (
                            <div className="text-sm text-gray-500 font-mono">{it.uid}</div>
                          )}
                        </td>

                        {/* Role */}
                        {/* Role */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEdit ? (
                            <select
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              value={d.role ?? 'user'}
                              onChange={(e) => setDrafts(prev => ({ ...prev, [it.id]: { ...d, role: e.target.value as UserRole } }))}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              it.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              <IconContext.Provider value={{ className: "mr-1" }}>
                                {it.role === 'admin' ? <FiShield /> : <FiUser />}
                              </IconContext.Provider>
                              {it.role}
                            </span>
                          )}
                        </td>
                        {/* Status */}
                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEdit ? (
                            <select
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              value={d.status ?? 'active'}
                              onChange={(e) => setDrafts(prev => ({ ...prev, [it.id]: { ...d, status: e.target.value as UserStatus } }))}
                            >
                              <option value="active">Active</option>
                              <option value="disabled">Disabled</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              it.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              <IconContext.Provider value={{ className: "mr-1" }}>
                                {it.status === 'active' ? <FiEye /> : <FiEyeOff />}
                              </IconContext.Provider>
                              {it.status}
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {isEdit ? (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => saveEdit(it.id)}
                                  className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                  title="Simpan"
                                >
                                  <FiSave size={14} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => cancelEdit(it.id)}
                                  className="p-1.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                  title="Batal"
                                >
                                  <FiX size={14} />
                                </motion.button>
                              </>
                            ) : (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => sendReset(it.email)}
                                  className="p-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                                  title="Reset Password"
                                >
                                  <FiKey size={14} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleRole(it)}
                                  className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                  title={it.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'}
                                >
                                  <FiShield size={14} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleStatus(it)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    it.status === 'active' 
                                      ? 'bg-amber-500 hover:bg-amber-600' 
                                      : 'bg-green-500 hover:bg-green-600'
                                  } text-white`}
                                  title={it.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                                >
                                  {it.status === 'active' ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => startEdit(it.id, it)}
                                  className="p-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                                  title="Edit"
                                >
                                  <FiEdit size={14} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => remove(it.id)}
                                  className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                  title="Hapus"
                                >
                                  <FiTrash2 size={14} />
                                </motion.button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  )
}