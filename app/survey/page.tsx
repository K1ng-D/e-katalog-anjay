// app/survey/page.tsx
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { motion } from "framer-motion";

const PRODUCT_CATS = ["pakaian", "aksesoris", "elektronik", "kecantikan", "rumah tangga", "lainnya"];
const FOOD_CATS = ["makanan ringan", "makanan berat", "minuman", "dessert", "lainnya"];

// --- Komponen yang pakai useSearchParams dibungkus Suspense ---
function SurveyContent() {
  const { user, profile } = useSession() as {
    user: { uid: string } | null;
    profile: UserProfile | null;
  };

  const router = useRouter();
  const sp = useSearchParams();
  const next = useMemo(() => sp.get("next") || "/dashboard/home", [sp]);

  const [productCats, setProductCats] = useState<string[]>([]);
  const [foodCats, setFoodCats] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [saving, setSaving] = useState(false);

  // Opsional: jika belum login, arahkan ke login
  useEffect(() => {
    if (user === null) router.replace(`/login?next=${encodeURIComponent("/survey")}`);
  }, [user, router]);

  // Jika sudah pernah isi survey, langsung ke next
  useEffect(() => {
    if (profile?.surveyCompleted) {
      router.replace(next);
    }
  }, [profile?.surveyCompleted, next, router]);

  // Load preferensi awal bila ada
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    (async () => {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      const data = (snap.data() as any) || {};
      setProductCats(data.preferences?.productCategories || []);
      setFoodCats(data.preferences?.foodCategories || []);
      setKeywords((data.preferences?.likedKeywords || []).join(", "));
    })();
  }, [user?.uid]);

  function toggle(arr: string[], v: string, setArr: (a: string[]) => void) {
    if (arr.includes(v)) setArr(arr.filter((x) => x !== v));
    else setArr([...arr, v]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uid = user?.uid;
    if (!uid) return;

    setSaving(true);
    try {
      const ref = doc(db, "users", uid);
      const liked = keywords
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        preferences: {
          productCategories: productCats,
          foodCategories: foodCats,
          likedKeywords: liked,
        },
        surveyCompleted: true,
        updatedAt: serverTimestamp(),
      };

      await setDoc(ref, payload, { merge: true });

      if (typeof window !== "undefined") {
        const tokens = [...productCats, ...foodCats, ...liked]
          .map((t) => t.toLowerCase())
          .filter(Boolean);
        sessionStorage.setItem("surveyDone", "1");
        sessionStorage.setItem("prefsTokens", JSON.stringify(tokens));
      }

      router.replace(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-white via-blue-50 to-orange-50">
      {/* aksen lembut */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-[320px] w-[320px] rounded-full bg-orange-200/30 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl p-[1.5px] bg-gradient-to-r from-blue-500/60 via-blue-500/20 to-orange-500/60 shadow-2xl"
        >
          <div className="rounded-[calc(1.5rem-1.5px)] border border-white/60 bg-white/85 backdrop-blur-lg">
            <div className="space-y-6 p-6 sm:p-8">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Preferensi Anda</h1>
                <p className="text-slate-600">Isi sebentar ya — biar rekomendasi pas selera.</p>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-8">
                {/* Produk */}
                <section>
                  <h2 className="mb-2 font-semibold text-slate-900">Kategori Produk Favorit</h2>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_CATS.map((c) => {
                      const active = productCats.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggle(productCats, c, setProductCats)}
                          className={`rounded-full border px-3 py-1.5 text-sm transition ${
                            active
                              ? "border-transparent bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                          aria-pressed={active}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Makanan */}
                <section>
                  <h2 className="mb-2 font-semibold text-slate-900">Kategori Makanan Favorit</h2>
                  <div className="flex flex-wrap gap-2">
                    {FOOD_CATS.map((c) => {
                      const active = foodCats.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggle(foodCats, c, setFoodCats)}
                          className={`rounded-full border px-3 py-1.5 text-sm transition ${
                            active
                              ? "border-transparent bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                          aria-pressed={active}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Kata kunci */}
                <section>
                  <h2 className="mb-2 font-semibold text-slate-900">Kata Kunci yang Anda Suka</h2>
                  <div className="rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-400/60">
                    <input
                      className="w-full rounded-xl bg-transparent px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      placeholder="contoh: manis, pedas, kopi, sepatu, skincare"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Pisahkan dengan spasi atau koma.</p>
                </section>

                {/* CTA */}
                <div className="flex items-center justify-end">
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={saving}
                  >
                    {saving ? (
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
                    ) : null}
                    {saving ? "Menyimpan…" : "Simpan & Lanjutkan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

// --- Wrapper dengan Suspense (WAJIB untuk useSearchParams) ---
export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6 max-w-3xl mx-auto">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </main>
      }
    >
      <SurveyContent />
    </Suspense>
  );
}
