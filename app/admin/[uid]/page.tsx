// app/admin/[uid]/page.tsx -- Admin Dashboard (protected)
"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useSession } from "@/components/providers/AuthProvider";
import Link from "next/link";
import {
  collection,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiShoppingBag,
  FiCoffee,
  FiRefreshCw,
  FiActivity,
  FiTrendingUp,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiPackage,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import type { ImageItem } from "@/lib/types";

// ---- Types lokal (mengacu ke skema koleksi)
type Product = {
  id?: string;
  name: string;
  price: number;
  images?: ImageItem[]; // sekarang pakai ImageItem[]
  category?: string;
  createdAt?: number;
};
type Food = {
  id?: string;
  name: string;
  price: number;
  weightGrams?: number;
  images?: ImageItem[]; // sekarang pakai ImageItem[]
  foodCategory?: string;
  createdAt?: number;
};
type UserProfile = {
  id?: string;
  uid: string;
  email: string;
  displayName?: string;
  role: "user" | "admin";
  status: "active" | "disabled";
  updatedAt?: number;
  createdAt?: number;
};

// ---- Helper: normalisasi data lama (string[]) → ImageItem[]
function normalizeImages(imgs: any[] | undefined): ImageItem[] {
  if (!imgs) return [];
  return imgs.map((it) => (typeof it === "string" ? { url: it } : it));
}

function fmtDate(ms?: number) {
  if (!ms) return "-";
  try {
    return new Date(ms).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function fmtRp(n: number | undefined) {
  const v = Number(n ?? 0);
  return "Rp " + v.toLocaleString("id-ID");
}

// Skeleton Loader Components
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 animate-pulse">
      <div className="h-6 w-20 bg-gray-200 rounded mb-4" />
      <div className="h-10 bg-gray-200 rounded w-3/4" />
    </div>
  );
}

function ListItemSkeleton() {
  return (
    <div className="flex items-center p-4 space-x-3 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-16" />
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useSession();

  // refs
  const usersRef = useMemo(() => collection(db, "users"), []);
  const productsRef = useMemo(() => collection(db, "products"), []);
  const foodsRef = useMemo(() => collection(db, "foods"), []);

  // totals
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [totalFoods, setTotalFoods] = useState<number | null>(null);
  const [loadingTotals, setLoadingTotals] = useState(true);

  // latest lists
  const [latestProducts, setLatestProducts] = useState<
    (Product & { id: string })[]
  >([]);
  const [latestFoods, setLatestFoods] = useState<(Food & { id: string })[]>([]);
  const [userActivities, setUserActivities] = useState<
    (UserProfile & { id: string })[]
  >([]);

  // fetch totals (on mount + manual refresh)
  async function refreshTotals() {
    setLoadingTotals(true);
    try {
      const [u, p, f] = await Promise.all([
        getCountFromServer(query(usersRef)),
        getCountFromServer(query(productsRef)),
        getCountFromServer(query(foodsRef)),
      ]);
      setTotalUsers(u.data().count);
      setTotalProducts(p.data().count);
      setTotalFoods(f.data().count);
    } finally {
      setLoadingTotals(false);
    }
  }

  useEffect(() => {
    refreshTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live latest products
  useEffect(() => {
    const qy = query(productsRef, orderBy("createdAt", "desc"), limit(5));
    const unsub = onSnapshot(qy, (snap) => {
      setLatestProducts(
        snap.docs.map((d) => {
          const raw = d.data() as any;
          return {
            id: d.id,
            ...raw,
            images: normalizeImages(raw.images),
          } as Product & { id: string };
        })
      );
    });
    return () => unsub();
  }, [productsRef]);

  // live latest foods
  useEffect(() => {
    const qy = query(foodsRef, orderBy("createdAt", "desc"), limit(5));
    const unsub = onSnapshot(qy, (snap) => {
      setLatestFoods(
        snap.docs.map((d) => {
          const raw = d.data() as any;
          return {
            id: d.id,
            ...raw,
            images: normalizeImages(raw.images),
          } as Food & { id: string };
        })
      );
    });
    return () => unsub();
  }, [foodsRef]);

  // live user activities (recent updates)
  useEffect(() => {
    const qy = query(usersRef, orderBy("updatedAt", "desc"), limit(5));
    const unsub = onSnapshot(qy, (snap) => {
      setUserActivities(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as UserProfile) }))
      );
    });
    return () => unsub();
  }, [usersRef]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const statCards: {
    title: string;
    value: number | null;
    icon: IconType;
    color: string;
    textColor: string;
  }[] = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: FiUsers,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      title: "Total Produk",
      value: totalProducts,
      icon: FiShoppingBag,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      title: "Total Makanan",
      value: totalFoods,
      icon: FiCoffee,
      color: "bg-orange-500",
      textColor: "text-orange-600",
    },
  ];

  return (
    <ProtectedRoute requireRole="admin">
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 space-y-8">
          {/* Header Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Halo, {user?.email} 👋</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={refreshTotals}
                  className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                  disabled={loadingTotals}
                >
                  <span
                    className={`mr-2 ${loadingTotals ? "animate-spin" : ""}`}
                  >
                    <FiRefreshCw />
                  </span>
                  {loadingTotals ? "Memuat…" : "Refresh Data"}
                </button>
              </motion.div>
              <Link
                href="/login"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span className="mr-2">
                  <FiUser />
                </span>
                Switch to User
              </Link>
            </div>
          </motion.div>

          {/* KPI cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  transition={{ delay: index * 0.1 + 0.1 }}
                  className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg ${card.color} bg-opacity-10 ${card.textColor}`}
                    >
                      <Icon size={24} />
                    </div>
                    <motion.div className="text-gray-400">
                      <FiTrendingUp />
                    </motion.div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {card.value ?? "—"}
                  </div>
                  <div className="text-sm text-gray-600">{card.title}</div>
                </motion.div>
              );
            })}
          </section>

          {/* Loading State for Stats */}
          {loadingTotals && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Latest lists */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Produk Terbaru */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-blue-600">
                    <FiPackage />
                  </span>
                  Produk Terbaru
                </h2>
              </div>
              {latestProducts.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                    {p.images?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400">
                          <FiPackage size={20} />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-1 gap-2">
                      <span className="flex items-center">
                        <span className="mr-1">
                          <FiCalendar size={12} />
                        </span>
                        {fmtDate(p.createdAt)}
                      </span>
                      {p.category && (
                        <span className="capitalize">{p.category}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600 flex items-center">
                    <span className="mr-1">
                      <FiDollarSign size={14} />
                    </span>
                    {fmtRp(p.price)}
                  </div>
                </motion.div>
              ))}
              {latestProducts.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <div className="mx-auto text-gray-400 mb-2 w-fit">
                    <FiPackage size={24} />
                  </div>
                  <p>Belum ada produk</p>
                </div>
              )}
            </div>

            {/* Makanan Terbaru */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-orange-600">
                    <FiCoffee />
                  </span>
                  Makanan Terbaru
                </h2>
              </div>
              {latestFoods.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                    {f.images?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.images[0].url}
                        alt={f.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400">
                          <FiCoffee size={20} />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {f.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-1 gap-2">
                      <span className="flex items-center">
                        <span className="mr-1">
                          <FiCalendar size={12} />
                        </span>
                        {fmtDate(f.createdAt)}
                      </span>
                      {f.foodCategory && (
                        <span className="capitalize">{f.foodCategory}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-orange-600 flex items-center">
                    <span className="mr-1">
                      <FiDollarSign size={14} />
                    </span>
                    {fmtRp(f.price)}
                  </div>
                </motion.div>
              ))}
              {latestFoods.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <div className="mx-auto text-gray-400 mb-2 w-fit">
                    <FiCoffee size={24} />
                  </div>
                  <p>Belum ada makanan</p>
                </div>
              )}
            </div>

            {/* Aktivitas User */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-purple-600">
                    <FiActivity />
                  </span>
                  Aktivitas User
                </h2>
              </div>
              {userActivities.map((u) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">
                      {u.displayName || u.email}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center">
                      <span className="mr-1">
                        <FiUser size={12} />
                      </span>
                      {u.email}
                    </div>
                    <div className="flex items-center">
                      <span className="ml-1">{fmtDate(u.updatedAt)}</span>
                    </div>
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        u.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {u.status === "active" ? "Aktif" : "Nonaktif"}
                    </div>
                  </div>
                </motion.div>
              ))}
              {userActivities.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <div className="mx-auto text-gray-400 mb-2 w-fit">
                    <FiActivity size={24} />
                  </div>
                  <p>Belum ada aktivitas</p>
                </div>
              )}
            </div>
          </motion.section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
