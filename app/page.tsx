"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiLogIn, FiUserPlus, FiGrid } from "react-icons/fi";

export default function HomePage() {
  return (
    <main className="h-screen w-full bg-gradient-to-br from-white to-slate-50 flex items-center justify-center text-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-8 px-6"
      >
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-900 text-white grid place-items-center shadow-lg">
            <FiGrid className="h-8 w-8" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Selamat Datang di <span className="bg-gradient-to-r from-indigo-500 to-teal-500 bg-clip-text text-transparent">e‑Katalog</span>
        </h1>

        <p className="max-w-xl mx-auto text-slate-600 text-lg">
          Kelola produk & makanan dengan tampilan modern, interaktif, dan aman.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-6 py-3 text-base font-medium shadow hover:bg-slate-800"
          >
            <FiLogIn className="h-5 w-5" />
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-6 py-3 text-base font-medium shadow ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <FiUserPlus className="h-5 w-5" />
            Register
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
