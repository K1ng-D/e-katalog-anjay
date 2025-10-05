// app/makanan/[id]/page.tsx -- Detail Makanan (login required)
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import UserNavbar from "@/components/UserNavbar";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiClock,
  FiBox,
  FiShoppingBag,
  FiMessageCircle,
  FiGlobe,
  FiCoffee,
} from "react-icons/fi";

type Food = {
  name: string;
  foodCategory?: string;
  description?: string;
  price: number;
  weightGrams?: number;
  images?: string[];
  links?: {
    whatsapp?: string;
    shopee?: string;
    tokopedia?: string;
    website?: string;
  };
  status?: "available" | "soldout" | "draft";
  createdAt?: number;
  updatedAt?: number;

  /** NEW: tampilkan pre-order */
  preorder?: 0 | 3 | 7 | 10; // 0 = Non-PO
};

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

// Skeleton Loader
function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded animate-pulse w-full"></div>
        </div>
      </div>
    </div>
  );
}

export default function MakananDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const docRef = useMemo(() => (id ? doc(db, "foods", id) : null), [id]);
  const [activeImage, setActiveImage] = useState(0);

  const [item, setItem] = useState<(Food & { id: string }) | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docRef) return;
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setItem({ id: snap.id, ...(snap.data() as Food) });
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [docRef]);

  /** NEW: WhatsApp URL dengan isi pesan otomatis + PO jika ada */
  const waUrl = (() => {
    if (!item?.links?.whatsapp) return undefined;
    const parts: string[] = [];
    parts.push(`Halo, saya ingin memesan: ${item.name}`);
    parts.push(`Harga: Rp ${Number(item.price || 0).toLocaleString("id-ID")}`);
    if (item?.preorder && item.preorder > 0)
      parts.push(`Pre-Order: ${item.preorder} hari`);
    const text = encodeURIComponent(parts.join("\n"));
    const base = item.links.whatsapp;
    return `${base}${base.includes("?") ? "&" : "?"}text=${text}`;
  })();

  if (loading) {
    return (
      <ProtectedRoute>
        <UserNavbar />
        <DetailSkeleton />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <UserNavbar />

        {/* Header Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              <span className="mr-2">
                <FiArrowLeft />
              </span>
              Kembali
            </motion.button>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {notFound ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100"
            >
              <div className="text-gray-400 mb-4 mx-auto">
                <FiShoppingBag size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Makanan Tidak Ditemukan
              </h2>
              <p className="text-gray-600 mb-6">
                Maaf, makanan yang Anda cari tidak ditemukan dalam katalog.
              </p>
              <Link
                href="/makanan"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-xl transition-colors inline-flex items-center"
              >
                <span className="mr-2">
                  <FiArrowLeft />
                </span>
                Kembali ke Daftar Makanan
              </Link>
            </motion.div>
          ) : item ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
              className="grid lg:grid-cols-2 gap-8"
            >
              {/* Gallery Section */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
                }}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
              >
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-4">
                  {item.images?.[activeImage] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[activeImage]}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-gray-400">
                        <FiCoffee size={48} />
                      </div>
                    </div>
                  )}
                </div>

                {item.images && item.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {item.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImage(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          activeImage === index
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={`${item.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Info Section */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: 20 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.5, delay: 0.2 },
                  },
                }}
                className="space-y-6"
              >
                <div>
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-3">
                    {item.foodCategory || "Makanan"}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {item.name}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-3xl font-bold text-blue-700">
                      Rp {Number(item.price || 0).toLocaleString("id-ID")}
                    </div>

                    {/* NEW: Badge Pre-Order bila ada */}
                    {item.preorder && item.preorder > 0 && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                        Pre-Order • {item.preorder} hari
                      </span>
                    )}
                  </div>
                </div>

                {item.status && (
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === "available"
                        ? "bg-green-100 text-green-800"
                        : item.status === "soldout"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        item.status === "available"
                          ? "bg-green-500"
                          : item.status === "soldout"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    {item.status === "available"
                      ? "Tersedia"
                      : item.status === "soldout"
                      ? "Habis"
                      : "Draft"}
                  </div>
                )}

                {typeof item.weightGrams === "number" && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">
                      <FiBox />
                    </span>
                    <span>Berat: {item.weightGrams}g</span>
                  </div>
                )}

                {item.description && (
                  <div className="prose prose-gray max-w-none">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Deskripsi
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Order Links */}
                {(item.links?.whatsapp ||
                  item.links?.shopee ||
                  item.links?.tokopedia ||
                  item.links?.website) && (
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Pesan melalui:
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {item.links?.whatsapp && (
                        <a
                          href={waUrl ?? item.links.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-colors ${
                            item.status === "soldout"
                              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                              : "bg-green-50 hover:bg-green-100 border-green-200 text-green-800"
                          }`}
                          title={
                            item.status === "soldout"
                              ? "Stok habis"
                              : "Pesan via WhatsApp"
                          }
                        >
                          <div className="mb-2">
                            <FiMessageCircle size={24} />
                          </div>
                          <span className="text-sm font-medium">
                            {item.status === "soldout"
                              ? "WhatsApp (Habis)"
                              : "WhatsApp"}
                          </span>
                        </a>
                      )}
                      {item.links?.shopee && (
                        <a
                          href={item.links.shopee}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-colors ${
                            item.status === "soldout"
                              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                              : "bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-800"
                          }`}
                          title={
                            item.status === "soldout"
                              ? "Stok habis"
                              : "Buka di Shopee"
                          }
                        >
                          <div className="mb-2">
                            <FiShoppingBag size={24} />
                          </div>
                          <span className="text-sm font-medium">
                            {item.status === "soldout"
                              ? "Shopee (Habis)"
                              : "Shopee"}
                          </span>
                        </a>
                      )}
                      {item.links?.tokopedia && (
                        <a
                          href={item.links.tokopedia}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-colors ${
                            item.status === "soldout"
                              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                              : "bg-green-50 hover:bg-green-100 border-green-200 text-green-800"
                          }`}
                          title={
                            item.status === "soldout"
                              ? "Stok habis"
                              : "Buka di Tokopedia"
                          }
                        >
                          <div className="mb-2">
                            <FiShoppingBag size={24} />
                          </div>
                          <span className="text-sm font-medium">
                            {item.status === "soldout"
                              ? "Tokopedia (Habis)"
                              : "Tokopedia"}
                          </span>
                        </a>
                      )}
                      {item.links?.website && (
                        <a
                          href={item.links.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-colors ${
                            item.status === "soldout"
                              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                              : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800"
                          }`}
                          title={
                            item.status === "soldout"
                              ? "Stok habis"
                              : "Kunjungi Website"
                          }
                        >
                          <div className="mb-2">
                            <FiGlobe size={24} />
                          </div>
                          <span className="text-sm font-medium">
                            {item.status === "soldout"
                              ? "Website (Habis)"
                              : "Website"}
                          </span>
                        </a>
                      )}
                    </div>

                    {/* NEW: Info PO ditampilkan jelas */}
                    {item.preorder && item.preorder > 0 && (
                      <div className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        Pesanan diproses sebagai{" "}
                        <span className="font-semibold">Pre-Order</span>.
                        Estimasi pengerjaan{" "}
                        <span className="font-semibold">
                          {item.preorder} hari kerja
                        </span>
                        .
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span className="mr-2">
                      <FiClock />
                    </span>
                    <span>Dibuat: {fmtDate(item.createdAt)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">
                      <FiClock />
                    </span>
                    <span>Diperbarui: {fmtDate(item.updatedAt)}</span>
                  </div>
                </div>

                {/* Back to list */}
                <div className="pt-6">
                  <Link
                    href="/dashboard/makanan"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    <span className="mr-2">
                      <FiArrowLeft />
                    </span>
                    Kembali ke Daftar Makanan
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} E-Katalog Makanan. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
