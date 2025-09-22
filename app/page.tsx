"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiLogIn, FiUserPlus } from "react-icons/fi"; // FiGrid dihapus karena tidak dipakai

const ease: number[] = [0.22, 1, 0.36, 1];

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-whitex text-slate-800 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="w-full max-w-2xl text-center space-y-7"
      >
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Selamat Datang di{" "}
          <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            LADUNIMART
          </span>
        </h1>

        <p className="mx-auto max-w-xl text-slate-600 text-lg">
          Kelola produk & makanan dengan tampilan sederhana, cepat, dan aman.
        </p>

        {/* CTA: biru & oranye */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-6 py-3 text-base font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition"
          >
            {/* Gunakan size alih-alih className */}
            <FiLogIn size={20} aria-hidden />
            Login
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-6 py-3 text-base font-semibold ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-400/60 transition"
          >
            <FiUserPlus size={20} aria-hidden />
            Register
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
