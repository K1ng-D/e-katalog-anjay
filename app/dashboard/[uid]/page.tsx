// app/dashboard/[uid]/page.tsx -- User Dashboard (protected)
'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useSession } from '@/components/providers/AuthProvider'
import UserNavbar from '@/components/UserNavbar'
import { updatePassword } from 'firebase/auth'
import { motion } from 'framer-motion'
import { FiUser, FiLock, FiMail, FiCalendar, FiCheckCircle, FiAlertCircle, FiKey } from 'react-icons/fi'

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
      if (err.code === 'auth/requires-recent-login') {
        setMsg('Silakan logout & login kembali sebelum mengganti password.')
      } else {
        setMsg(err.message || 'Gagal mengganti password.')
      }
      setMsgType('error')
    } finally {
      setLoading(false)
    }
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <ProtectedRoute requireRole="user">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <UserNavbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Pengguna</h1>
            <p className="text-gray-600">Kelola informasi dan pengaturan akun Anda</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* User Info Card */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
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
                  <div className="mr-3 text-gray-400"><FiMail /></div>
                  <span>{user?.email}</span>
                </div>
                
                {profile?.createdAt && (
                  <div className="flex items-center text-gray-600">
                    <div className="mr-3 text-gray-400"><FiCalendar /></div>
                    <span>
                      Bergabung pada {new Date(profile.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-gray-600">
                  <div className="mr-3 text-gray-400"><FiUser /></div>
                  <span className="capitalize">{profile?.role || 'user'}</span>
                </div>
              </div>
            </motion.div>

            {/* Change Password Card */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <div className="text-blue-600">
                    <FiKey size={20} />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 ml-3">Ubah Password</h2>
              </div>

              <form onSubmit={onChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Baru
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"><FiLock /></div>
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Masukkan password baru"
                      required
                    />
                  </div>
                  {newPass.length > 0 && newPass.length < 6 && (
                    <p className="text-red-500 text-xs mt-1">Password minimal 6 karakter</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"><FiLock /></div>
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Konfirmasi password baru"
                      required
                    />
                  </div>
                  {confirmPass.length > 0 && newPass !== confirmPass && (
                    <p className="text-red-500 text-xs mt-1">Password tidak cocok</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                  className={`mt-4 p-3 rounded-lg flex items-center ${
                    msgType === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {msgType === 'success' ? (
                    <div className="mr-2"><FiCheckCircle /></div>
                  ) : (
                    <div className="mr-2"><FiAlertCircle /></div>
                  )}
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