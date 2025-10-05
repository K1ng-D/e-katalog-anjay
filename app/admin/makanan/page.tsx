// app/admin/makanan/page.tsx  -- Management Makanan (CRUD, safe Firestore + Cloudinary API)
"use client";

import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminSidebar from "@/components/AdminSidebar";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Food } from "@/lib/types";
import CloudinaryUploadApiMulti from "@/components/CloudinaryMultiUpload";
import { motion } from "framer-motion";
import {
  FiCoffee,
  FiDollarSign,
  FiImage,
  FiLink,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiShoppingBag,
  FiTag,
  FiFileText,
  FiGrid,
  FiCheckCircle,
  FiPower,
} from "react-icons/fi";

// ---- Utility: hapus semua undefined sebelum write ke Firestore ----
function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj
      .filter((v) => v !== undefined)
      .map((v) =>
        v && typeof v === "object" ? stripUndefined(v as any) : v
      ) as any;
  }
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as any)) {
      if (v === undefined) continue;
      out[k] = v && typeof v === "object" ? stripUndefined(v as any) : v;
    }
    return out;
  }
  return obj;
}

// ---- Default form state ----
const initialForm: Food = {
  name: "",
  foodCategory: "makanan ringan",
  description: "",
  price: 0,
  weightGrams: 0,
  images: [],
  links: { whatsapp: "", shopee: "", tokopedia: "", website: "" },
  status: "available",
  createdAt: Date.now(),
  updatedAt: Date.now(),

  // NEW
  preorder: 0, // 0 = Non-PO
};

export default function MakananAdminPage() {
  const [items, setItems] = useState<(Food & { id: string })[]>([]);
  const [form, setForm] = useState<Food>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const foodsRef = useMemo(() => collection(db, "foods"), []);

  useEffect(() => {
    const q = query(foodsRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Food) }));
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, [foodsRef]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isUploading) {
      alert("Tunggu upload gambar selesai dulu ya.");
      return;
    }

    const payload = stripUndefined({
      ...form,
      images: form.images ?? [],
      foodCategory: form.foodCategory || "makanan ringan",
      status: form.status || "available",
      price: Number.isFinite(form.price) ? form.price : 0,
      weightGrams: Number.isFinite(form.weightGrams ?? 0)
        ? form.weightGrams ?? 0
        : 0,

      // NEW: normalisasi PO
      preorder: (form.preorder ?? 0) as 0 | 3 | 7 | 10,

      updatedAt: Date.now(),
      ...(editingId ? {} : { createdAt: Date.now() }),
    });

    try {
      if (editingId) {
        await updateDoc(doc(foodsRef, editingId), payload as any);
        setEditingId(null);
      } else {
        await addDoc(foodsRef, payload as any);
      }
      setForm(initialForm);
    } catch (error) {
      console.error("Error saving food:", error);
      alert("Terjadi kesalahan saat menyimpan makanan");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus makanan ini?")) return;
    await deleteDoc(doc(foodsRef, id));
  }

  function onEdit(item: Food & { id: string }) {
    setEditingId(item.id!);
    setForm({
      ...item,
      images: item.images ?? [],
      links: {
        whatsapp: "",
        shopee: "",
        tokopedia: "",
        website: "",
        ...(item.links || {}),
      },
      status: (item.status as Food["status"]) ?? "available",
      foodCategory:
        (item.foodCategory as Food["foodCategory"]) ?? "makanan ringan",
      price: Number.isFinite(item.price) ? item.price : 0,
      weightGrams: Number.isFinite(item.weightGrams ?? 0)
        ? item.weightGrams ?? 0
        : 0,

      // NEW
      preorder: (item.preorder as 0 | 3 | 7 | 10) ?? 0,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const foodCategories = [
    { value: "makanan ringan", label: "Makanan Ringan" },
    { value: "makanan berat", label: "Makanan Berat" },
    { value: "minuman", label: "Minuman" },
    { value: "dessert", label: "Dessert" },
    { value: "lainnya", label: "Lainnya" },
  ];

  const statusOptions = [
    { value: "available", label: "Available" },
    { value: "soldout", label: "Sold Out" },
    { value: "draft", label: "Draft" },
  ];

  return (
    <ProtectedRoute requireRole="admin">
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 space-y-6 p-6 lg:p-8">
          {/* Header Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Management Makanan
              </h1>
              <p className="mt-1 text-gray-600">Kelola menu makanan Anda</p>
            </div>
            {editingId && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={cancelEdit}
                className="flex items-center rounded-xl bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400"
              >
                <span className="mr-2 inline-flex">
                  <FiX size={16} />
                </span>
                Batalkan Edit
              </motion.button>
            )}
          </motion.div>

          {/* Form Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-6 flex items-center text-xl font-semibold text-gray-900">
              <span className="mr-2 inline-flex text-orange-600">
                <FiCoffee size={18} />
              </span>
              {editingId ? "Edit Makanan" : "Tambah Makanan Baru"}
            </h2>

            <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
                    <span className="mr-2 inline-flex text-gray-400">
                      <FiShoppingBag size={16} />
                    </span>
                    Nama Makanan
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Masukkan nama makanan"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
                    <span className="mr-2 inline-flex text-gray-400">
                      <FiTag size={16} />
                    </span>
                    Kategori Makanan
                  </label>
                  <select
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.foodCategory}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        foodCategory: e.target.value as Food["foodCategory"],
                      })
                    }
                  >
                    {foodCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
                    <span className="mr-2 inline-flex text-gray-400">
                      <FiFileText size={16} />
                    </span>
                    Deskripsi
                  </label>
                  <textarea
                    className="min-h-[100px] w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Deskripsi makanan..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
                      <span className="mr-2 inline-flex text-gray-400">
                        <FiDollarSign size={16} />
                      </span>
                      Harga
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          price:
                            e.target.value === "" ? 0 : Number(e.target.value),
                        })
                      }
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
                      <span className="mr-2 inline-flex text-gray-400">
                        <FiPower size={16} />
                      </span>
                      Berat (gram)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.weightGrams ?? 0}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          weightGrams:
                            e.target.value === "" ? 0 : Number(e.target.value),
                        })
                      }
                      min="0"
                    />
                  </div>
                </div>

                {/* NEW: Pre-Order */}
                <div>
                  <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
                    Pre-Order
                  </label>
                  <select
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.preorder ?? 0}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        preorder: Number(e.target.value) as 0 | 3 | 7 | 10,
                      })
                    }
                  >
                    <option value={0}>Tidak (Ready/Non-PO)</option>
                    <option value={3}>3 Hari</option>
                    <option value={7}>7 Hari</option>
                    <option value={10}>10 Hari</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Jika dipilih, menu akan ditandai sebagai Pre-Order dengan
                    estimasi hari tertera.
                  </p>
                </div>

                <div>
                  <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
                    <span className="mr-2 inline-flex text-gray-400">
                      <FiCheckCircle size={16} />
                    </span>
                    Status
                  </label>
                  <select
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as Food["status"],
                      })
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
                    <span className="mr-2 inline-flex text-gray-400">
                      <FiImage size={16} />
                    </span>
                    Gambar Makanan
                  </label>
                  <CloudinaryUploadApiMulti
                    onUploaded={(urls) =>
                      setForm({ ...form, images: urls ?? [] })
                    }
                    onUploadingChange={setIsUploading}
                  />
                  {form.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.images.map((url, index) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={index}
                          src={url}
                          alt={`Preview ${index}`}
                          className="h-12 w-12 rounded-lg border object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
                    <span className="mr-2 inline-flex text-gray-400">
                      <FiLink size={16} />
                    </span>
                    Link Pembelian
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        WhatsApp
                      </label>
                      <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.links?.whatsapp || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            links: { ...form.links, whatsapp: e.target.value },
                          })
                        }
                        placeholder="https://wa.me/62…"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Website
                      </label>
                      <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.links?.website || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            links: { ...form.links, website: e.target.value },
                          })
                        }
                        placeholder="https://website.com"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Shopee
                      </label>
                      <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.links?.shopee || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            links: { ...form.links, shopee: e.target.value },
                          })
                        }
                        placeholder="https://shopee.co.id"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Tokopedia
                      </label>
                      <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.links?.tokopedia || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            links: { ...form.links, tokopedia: e.target.value },
                          })
                        }
                        placeholder="https://tokopedia.com"
                      />
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isUploading}
                  className="flex w-full items-center justify-center rounded-xl bg-orange-600 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-400"
                >
                  {isUploading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <span className="mr-2 inline-flex">
                        <FiSave size={16} />
                      </span>
                      {editingId ? "Update Makanan" : "Tambah Makanan"}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Foods Table */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="flex items-center text-xl font-semibold text-gray-900">
                <span className="mr-2 inline-flex text-orange-600">
                  <FiGrid size={18} />
                </span>
                Daftar Makanan ({items.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Makanan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Kategori
                    </th>

                    {/* NEW HEADER: Pre-Order */}
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Pre-Order
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Berat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    // Skeleton Loaders
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded bg-gray-200"></div>
                            <div className="ml-3 space-y-2">
                              <div className="h-4 w-24 rounded bg-gray-200"></div>
                              <div className="h-3 w-16 rounded bg-gray-200"></div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-4 w-20 rounded bg-gray-200"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-4 w-20 rounded bg-gray-200"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-4 w-16 rounded bg-gray-200"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-4 w-12 rounded bg-gray-200"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-6 w-16 rounded bg-gray-200"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-8 w-20 rounded bg-gray-200"></div>
                        </td>
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <span className="mx-auto mb-4 inline-flex">
                          <FiCoffee size={48} />
                        </span>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                          Belum ada makanan
                        </h3>
                        <p className="text-gray-600">
                          Mulai dengan menambahkan makanan pertama Anda
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr
                        key={it.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            {it.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={it.images[0]}
                                alt={it.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
                                <span className="inline-flex text-gray-400">
                                  <FiCoffee size={18} />
                                </span>
                              </div>
                            )}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {it.name}
                              </div>
                              <div className="line-clamp-1 text-xs text-gray-500">
                                {it.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium capitalize text-orange-800">
                            {it.foodCategory}
                          </span>
                        </td>

                        {/* NEW: Pre-Order badge */}
                        <td className="whitespace-nowrap px-6 py-4">
                          {it.preorder && it.preorder > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                              PO {it.preorder} hari
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                              Non-PO
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            Rp {Number(it.price || 0).toLocaleString("id-ID")}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {it.weightGrams ? `${it.weightGrams}g` : "-"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              it.status === "available"
                                ? "bg-green-100 text-green-800"
                                : it.status === "soldout"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800",
                            ].join(" ")}
                          >
                            {it.status === "available"
                              ? "Available"
                              : it.status === "soldout"
                              ? "Sold Out"
                              : "Draft"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onEdit(it)}
                              className="rounded-lg bg-yellow-500 p-1.5 text-white transition-colors hover:bg-yellow-600"
                              title="Edit"
                            >
                              <FiEdit size={14} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onDelete(it.id!)}
                              className="rounded-lg bg-red-600 p-1.5 text-white transition-colors hover:bg-red-700"
                              title="Hapus"
                            >
                              <FiTrash2 size={14} />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
