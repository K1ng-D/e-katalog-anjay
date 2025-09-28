// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, type Easing, type Variants } from "framer-motion";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product as TProduct, Food as TFood } from "@/lib/types";
import { FiLogIn, FiUserPlus, FiClock, FiTrendingUp } from "react-icons/fi";

const ease: Easing = [0.22, 1, 0.36, 1];

type Product = Omit<TProduct, "id"> & { id: string };
type Food = Omit<TFood, "id"> & { id: string };

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 110, damping: 16 } },
};

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-5">
        {Icon && (
          <span className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow">
            <Icon size={18} />
          </span>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Card({
  img,
  overline,
  title,
  subtitle,
}: {
  img?: string;
  overline?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -6 }} className="h-full">
      {/* Semua card menuju /login */}
      <Link href="/login" className="block h-full">
        <div className="h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all">
          <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
            {img ? (
              <img
                src={img}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No image
              </div>
            )}
            {overline && (
              <span className="absolute top-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/90 text-slate-700 shadow">
                {overline}
              </span>
            )}
            <span className="absolute top-3 right-3 text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-500 text-white shadow">
              Baru
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-slate-900 line-clamp-2">{title}</h3>
            {subtitle && <div className="mt-1.5 text-blue-700 font-bold">{subtitle}</div>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const productsRef = useMemo(() => collection(db, "products"), []);
  const foodsRef = useMemo(() => collection(db, "foods"), []);

  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [latestFoods, setLatestFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub1 = onSnapshot(
      query(productsRef, orderBy("createdAt", "desc"), limit(8)),
      (snap) => setLatestProducts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TProduct) })))
    );
    const unsub2 = onSnapshot(
      query(foodsRef, orderBy("createdAt", "desc"), limit(8)),
      (snap) => setLatestFoods(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TFood) })))
    );
    const t = setTimeout(() => setLoading(false), 300);
    return () => {
      unsub1();
      unsub2();
      clearTimeout(t);
    };
  }, [productsRef, foodsRef]);

  return (
    <main className="min-h-screen w-full">
      {/* HERO — sama seperti versi awal */}
      <section
        className="min-h-[70vh] w-full bg-cover bg-center flex items-center justify-center px-6"
        style={{ backgroundImage: "url('/images/makanan.jpg')" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="w-full max-w-2xl text-center space-y-7 bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Selamat Datang di{" "}
            <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              LADUNIMART
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-slate-700 text-lg">
            Kelola produk & makanan dengan tampilan sederhana, cepat, dan aman.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-6 py-3 text-base font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition"
            >
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
      </section>

      {/* LISTING TERBARU */}
      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Produk Terbaru */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Section title="Produk Terbaru" icon={FiClock}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={`pskel-${i}`}
                        className="h-60 rounded-2xl bg-white/70 backdrop-blur animate-pulse border border-slate-200"
                      />
                    ))
                  : latestProducts.length > 0
                  ? latestProducts.map((p) => (
                      <Card
                        key={p.id}
                        img={p.images?.[0]}
                        overline={(p.category || "LAINNYA").toUpperCase()}
                        title={p.name}
                        subtitle={`Rp ${Number(p.price || 0).toLocaleString("id-ID")}`}
                      />
                    ))
                  : (
                    <div className="col-span-full text-center text-slate-500 py-10">
                      Belum ada produk terbaru.
                    </div>
                  )}
              </div>
            </Section>
          </motion.div>

          {/* Makanan Terbaru */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mt-2">
            <Section title="Makanan Terbaru" icon={FiTrendingUp}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={`fskel-${i}`}
                        className="h-60 rounded-2xl bg-white/70 backdrop-blur animate-pulse border border-slate-200"
                      />
                    ))
                  : latestFoods.length > 0
                  ? latestFoods.map((f) => (
                      <Card
                        key={f.id}
                        img={f.images?.[0]}
                        overline={(f.foodCategory || "LAINNYA").toUpperCase()}
                        title={f.name}
                        subtitle={`Rp ${Number(f.price || 0).toLocaleString("id-ID")}`}
                      />
                    ))
                  : (
                    <div className="col-span-full text-center text-slate-500 py-10">
                      Belum ada makanan terbaru.
                    </div>
                  )}
              </div>
            </Section>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
