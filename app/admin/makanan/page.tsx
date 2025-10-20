// app/admin/makanan/page.tsx
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
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Food, ImageItem } from "@/lib/types";
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

// ---- Helper: normalisasi images lama (string[]) → ImageItem[] ----
function normalizeImages(imgs: any[] | undefined): ImageItem[] {
  if (!imgs) return [];
  return imgs.map((it) => (typeof it === "string" ? { url: it } : it));
}

async function deleteFromCloudinary(publicId?: string) {
  if (!publicId) return;
  try {
    await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });
  } catch (e) {
    console.warn("Gagal hapus Cloudinary:", e);
  }
}

// ---- Default form state (pakai fungsi agar timestamp selalu fresh) ----
function makeInitialForm(): Food {
  const now = Date.now();
  return {
    name: "",
    foodCategory: "makanan ringan",
    description: "",
    price: 0,
    weightGrams: 0,
    images: [],
    links: { whatsapp: "", shopee: "", tokopedia: "", website: "" },
    status: "available",
    createdAt: now,
    updatedAt: now,
    preorder: 0, // 0 = Non-PO
  };
}

export default function MakananAdminPage() {
  const [items, setItems] = useState<(Food & { id: string })[]>([]);
  const [form, setForm] = useState<Food>(makeInitialForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const foodsRef = useMemo(() => collection(db, "foods"), []);

  useEffect(() => {
    const q = query(foodsRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data() as any;
        return {
          id: d.id,
          ...raw,
          images: normalizeImages(raw.images),
        } as Food & { id: string };
      });
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
      images: normalizeImages(form.images),
      foodCategory: form.foodCategory || "makanan ringan",
      status: form.status || "available",
      price: Number.isFinite(form.price) ? form.price : 0,
      weightGrams: Number.isFinite(form.weightGrams ?? 0)
        ? form.weightGrams ?? 0
        : 0,
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
      setForm(makeInitialForm());
    } catch (error) {
      console.error("Error saving food:", error);
      alert("Terjadi kesalahan saat menyimpan makanan");
    }
  }

  async function onDelete(id: string) {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus makanan ini beserta semua gambarnya?"
      )
    )
      return;

    try {
      const ref = doc(foodsRef, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        // sudah tidak ada; sinkronkan UI
        setItems((prev) => prev.filter((x) => x.id !== id));
        return;
      }
      const data = snap.data() as any;
      const imgs: ImageItem[] = normalizeImages(data?.images);

      // Hapus semua file di Cloudinary (yang punya publicId)
      await Promise.all(imgs.map((i) => deleteFromCloudinary(i.publicId)));

      // Baru hapus dokumen
      await deleteDoc(ref);

      // Jika sedang mengedit item yang dihapus → reset form
      if (editingId === id) {
        setEditingId(null);
        setForm(makeInitialForm());
      }
    } catch (err) {
      console.error("Gagal hapus makanan:", err);
      alert("Gagal menghapus makanan. Coba lagi.");
    }
  }

  function onEdit(item: Food & { id: string }) {
    setEditingId(item.id);
    setForm({
      ...item,
      images: normalizeImages(item.images),
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
      preorder: (item.preorder as 0 | 3 | 7 | 10) ?? 0,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(makeInitialForm());
  }

  async function handleRemoveImageAt(index: number) {
    const imgs = normalizeImages(form.images);
    const target = imgs[index];
    if (!target) return;

    const ok = confirm("Hapus gambar ini?");
    if (!ok) return;

    // 1) Hapus di Cloudinary (jika ada publicId)
    await deleteFromCloudinary(target.publicId);

    // 2) Hapus dari form state
    const next = imgs.filter((_, i) => i !== index);
    setForm((f) => ({ ...f, images: next, updatedAt: Date.now() }));

    // 3) Jika sedang edit dokumen, sekalian simpan ke Firestore
    if (editingId) {
      try {
        await updateDoc(doc(foodsRef, editingId), {
          images: stripUndefined(next),
          updatedAt: Date.now(),
        } as any);
      } catch (err) {
        console.error("Gagal update setelah hapus gambar:", err);
        alert("Gagal menyimpan perubahan setelah hapus gambar.");
      }
    }
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
                    onUploaded={(files) =>
                      setForm((f) => ({
                        ...f,
                        images: normalizeImages([
                          ...(f.images ?? []),
                          ...files,
                        ]),
                      }))
                    }
                    onUploadingChange={setIsUploading}
                  />
                  {normalizeImages(form.images).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {normalizeImages(form.images).map((img, index) => (
                        <div key={`${img.url}-${index}`} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={`Preview ${index}`}
                            className="h-16 w-16 rounded-lg border object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImageAt(index)}
                            className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                            title="Hapus gambar"
                          >
                            ✕
                          </button>
                        </div>
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
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
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
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded bg-gray-200" />
                            <div className="ml-3 space-y-2">
                              <div className="h-4 w-24 rounded bg-gray-200" />
                              <div className="h-3 w-16 rounded bg-gray-200" />
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-4 w-20 rounded bg-gray-200" />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-4 w-20 rounded bg-gray-200" />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-4 w-16 rounded bg-gray-200" />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-4 w-12 rounded bg-gray-200" />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-6 w-16 rounded bg-gray-200" />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-8 w-20 rounded bg-gray-200" />
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
                            {it.images?.[0]?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={it.images[0].url}
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
