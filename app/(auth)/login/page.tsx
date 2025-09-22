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
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-white via-blue-50 to-orange-50">
      {/* aksen lembut */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-[320px] w-[320px] rounded-full bg-orange-200/30 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Card dengan border gradient biru→oranye */}
          <div className="rounded-3xl p-[1.5px] bg-gradient-to-r from-blue-500/50 via-blue-500/20 to-orange-500/50 shadow-2xl">
            <div className="rounded-[calc(1.5rem-1.5px)] border border-white/60 bg-white/80 backdrop-blur-lg">
              <div className="px-6 py-7 sm:px-8 sm:py-9">
                {/* Header */}
                <div className="mb-6 flex items-center justify-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-orange-500 text-white shadow">
                    <FiLogIn size={18} aria-hidden />
                  </div>
                  <div className="text-center">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Login User</h1>
                    <p className="text-sm text-slate-500">Masuk ke akun LADUNIMART Anda</p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Email */}
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                    <div className="group relative flex items-center rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-400/60">
                      <span className="pl-3 text-slate-400">
                        <FiMail size={16} aria-hidden />
                      </span>
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
                    <div className="relative flex items-center rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-orange-400/60">
                      <span className="pl-3 text-slate-400">
                        <FiLock size={16} aria-hidden />
                      </span>
                      <input
                        type={showPw ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl bg-transparent px-3 py-2.5 pr-10 text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        className="absolute right-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
                        aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showPw ? <FiEyeOff size={16} aria-hidden /> : <FiEye size={16} aria-hidden />}
                      </button>
                    </div>
                  </label>

                  {/* Error */}
                  {error && (
                    <div
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                      aria-live="polite"
                    >
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-blue-400/60 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <FiLogIn size={16} aria-hidden />
                    )}
                    {loading ? "Memproses…" : "Login"}
                  </button>
                </form>

                {/* Bottom actions */}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <a href="/forgot-password" className="text-slate-500 hover:text-slate-700">
                    Lupa password?
                  </a>
                  <div className="text-slate-500">
                    Belum punya akun?{" "}
                    <a href="/register" className="font-medium text-blue-700 hover:underline">
                      Register
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

        
        </motion.div>
      </div>
    </main>
  );
}
