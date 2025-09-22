// app/dashboard/[uid]/page.tsx -- User Dashboard (protected)
'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useSession } from '@/components/providers/AuthProvider'
import UserNavbar from '@/components/UserNavbar'
import { updatePassword } from 'firebase/auth'
import { motion, type Variants } from 'framer-motion'
import {
  FiUser,
  FiLock,
  FiMail,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiKey,
} from 'react-icons/fi'

// 🔧 helper: konversi berbagai bentuk waktu → Date aman
function toDate(val: unknown): Date | null {
  if (!val) return null
  if (typeof val === 'string') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof val === 'number') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof (val as any)?.toDate === 'function') {
    const d = (val as any).toDate()
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof (val as any)?.seconds === 'number') {
    const d = new Date((val as any).seconds * 1000)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function UserDashboard() {
  const { user, profile } = useSession()

  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgType, setMsgType] = useState<'success' | 'error' | null>(null)

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setMsgType(null)

    if (!user) {
      setMsg('User tidak ditemukan.')
      setMsgType('error')
      return
    }
    if (newPass.length < 6) {
      setMsg('Password minimal 6 karakter.')
      setMsgType('error')
      return
    }
    if (newPass !== confirmPass) {
      setMsg('Konfirmasi password tidak cocok.')
      setMsgType('error')
      return
    }

    try {
      setLoading(true)
      await updatePassword(user, newPass)
      setMsg('Password berhasil diperbarui!')
      setMsgType('success')
      setNewPass('')
      setConfirmPass('')
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        setMsg('Silakan logout & login kembali sebelum mengganti password.')
      } else {
        setMsg(err?.message || 'Gagal mengganti password.')
      }
      setMsgType('error')
    } finally {
      setLoading(false)
    }
  }

  // Ambil tanggal bergabung dari profile.createdAt (Firestore) atau metadata user (Auth)
  const joinedAt =
    toDate(profile?.createdAt) ??
    toDate((user as any)?.metadata?.creationTime)

  return (
    <ProtectedRoute requireRole="user">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <UserNavbar />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="mb-8 text-center"
          >
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Dashboard Pengguna
            </h1>
            <p className="text-gray-600">
              Kelola informasi dan pengaturan akun Anda
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Kartu Info User */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-6 flex items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-2xl font-bold text-white">
                  {profile?.displayName?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    'U'}
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {profile?.displayName || 'Pengguna'}
                  </h2>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <div className="mr-3 text-gray-400">
                    <FiMail size={18} />
                  </div>
                  <span className="break-all">{user?.email}</span>
                </div>

                {joinedAt && (
                  <div className="flex items-center text-gray-600">
                    <div className="mr-3 text-gray-400">
                      <FiCalendar size={18} />
                    </div>
                    <span>
                      Bergabung pada{' '}
                      {joinedAt.toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                <div className="flex items-center text-gray-600">
                  <div className="mr-3 text-gray-400">
                    <FiUser size={18} />
                  </div>
                  <span className="capitalize">
                    {profile?.role || 'user'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Kartu Ubah Password */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-6 flex items-center">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                  <FiKey size={20} />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900">
                  Ubah Password
                </h2>
              </div>

              <form onSubmit={onChangePassword} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Password Baru
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FiLock size={16} />
                    </div>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 pl-10 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Masukkan password baru"
                      required
                    />
                  </div>
                  {newPass.length > 0 && newPass.length < 6 && (
                    <p className="mt-1 text-xs text-red-500">
                      Password minimal 6 karakter
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FiLock size={16} />
                    </div>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 pl-10 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Konfirmasi password baru"
                      required
                    />
                  </div>
                  {confirmPass.length > 0 && newPass !== confirmPass && (
                    <p className="mt-1 text-xs text-red-500">
                      Password tidak cocok
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Menyimpan...
                    </>
                  ) : (
                    'Ubah Password'
                  )}
                </button>
              </form>

              {msg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 flex items-center rounded-lg p-3 ${
                    msgType === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <div className="mr-2">
                    {msgType === 'success' ? (
                      <FiCheckCircle size={18} />
                    ) : (
                      <FiAlertCircle size={18} />
                    )}
                  </div>
                  <span className="text-sm">{msg}</span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
