"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { FiLogIn, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

function mapFirebaseError(code?: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/user-disabled":
      return "Akun dinonaktifkan. Hubungi admin.";
    case "auth/user-not-found":
      return "Pengguna tidak ditemukan.";
    case "auth/wrong-password":
      return "Password salah.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan, coba lagi nanti.";
    default:
      return "Gagal login. Periksa kembali data Anda.";
  }
}

export default function UserLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push(`/dashboard/${user.uid}`);
    } catch (err: any) {
      const msg = mapFirebaseError(err?.code);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-white to-slate-50">
      {/* soft background blobs */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-[320px] w-[320px] rounded-full bg-teal-200/40 blur-3xl" />

      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur shadow-xl">
            <div className="px-6 py-7 sm:px-8 sm:py-9">
              {/* Logo / Title */}
              <div className="mb-6 flex items-center justify-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white shadow">
                  <FiLogIn h-5 className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">Login User</h1>
                  <p className="text-sm text-slate-500">Masuk ke akun e‑Kataloh Anda</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Email */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                  <div className="group relative flex items-center rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-slate-400">
                    <span className="pl-3 text-slate-400"><FiMail className="h-4 w-4" /></span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl bg-transparent px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>
                </label>

                {/* Password */}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
                  <div className="relative flex items-center rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-slate-400">
                    <span className="pl-3 text-slate-400"><FiLock className="h-4 w-4" /></span>
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-transparent px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
                      aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPw ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" aria-live="polite">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <FiLogIn className="h-4 w-4" />
                  )}
                  {loading ? "Memproses…" : "Login"}
                </button>
              </form>

              {/* Bottom actions */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <a href="/forgot-password" className="text-slate-500 hover:text-slate-700">Lupa password?</a>
                <div className="text-slate-500">
                  Belum punya akun? <a href="/register" className="font-medium text-slate-900 hover:underline">Register</a>
                </div>
              </div>
            </div>
          </div>

          {/* helper text */}
          <p className="mt-4 text-center text-xs text-slate-500">Dilindungi oleh Firebase Auth • UI Notion‑style</p>
        </motion.div>
      </div>
    </main>
  );
}
