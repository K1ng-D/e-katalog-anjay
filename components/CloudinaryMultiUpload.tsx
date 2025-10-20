// components/CloudinaryUploadApiMulti.tsx
"use client";

import { useRef, useState } from "react";
import { FiUploadCloud, FiTrash2 } from "react-icons/fi";
import type { ImageItem } from "@/lib/types";

type Props = {
  /** Dipanggil setelah upload sukses, berisi akumulasi file yang sudah ter-upload */
  onUploaded?: (files: ImageItem[]) => void;

  /** Notifikasi ke parent saat status upload berubah */
  onUploadingChange?: (v: boolean) => void;

  /** Batas maksimal file yang bisa dipilih sekaligus */
  maxFiles?: number;

  /** (Opsional) nilai awal ketika komponen dimount */
  defaultValue?: ImageItem[];

  /** (Opsional) disable tombol/input */
  disabled?: boolean;

  /** (Opsional) teks tombol pilih file */
  buttonText?: string;
};

export default function CloudinaryUploadApiMulti({
  onUploaded,
  onUploadingChange,
  maxFiles = 8,
  defaultValue = [],
  disabled = false,
  buttonText = "Pilih Gambar",
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<ImageItem[]>(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setLoading(true);
    onUploadingChange?.(true);
    setError(null);

    try {
      const limited = Array.from(files).slice(0, maxFiles);
      const form = new FormData();
      limited.forEach((f) => form.append("files", f)); // key harus 'files'

      const res = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload gagal");
      }

      const uploaded: ImageItem[] = (data?.files ?? []).map((f: any) => ({
        url: f.url,
        publicId: f.publicId,
      }));

      const merged = [...items, ...uploaded];
      setItems(merged);
      onUploaded?.(merged);
    } catch (err: any) {
      setError(err?.message ?? "Upload gagal");
    } finally {
      setLoading(false);
      onUploadingChange?.(false);
      // reset input supaya bisa pilih file yang sama lagi jika perlu
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onChangeInput(e: React.ChangeEvent<HTMLInputElement>) {
    void handleFiles(e.target.files);
  }

  function removeLocalAt(index: number) {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    onUploaded?.(next);
  }

  function resetAll() {
    setItems([]);
    onUploaded?.([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onChangeInput}
        disabled={disabled || loading}
      />

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="inline-flex items-center rounded-lg border bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiUploadCloud className="mr-2" />
          {loading ? "Mengupload..." : buttonText}
        </button>

        {items.length > 0 && (
          <button
            type="button"
            onClick={resetAll}
            disabled={disabled || loading}
            className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            title="Hapus semua dari daftar (lokal)"
          >
            <FiTrash2 className="mr-2" />
            Bersihkan
          </button>
        )}
      </div>

      {/* Status */}
      {loading && <div className="text-sm text-gray-600">Mengupload…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Preview */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {items.map((it, idx) => (
            <div key={`${it.url}-${idx}`} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.url}
                alt={`uploaded-${idx}`}
                className="h-24 w-full rounded object-cover ring-1 ring-gray-200"
              />
              <button
                type="button"
                onClick={() => removeLocalAt(idx)}
                className="absolute right-1 top-1 hidden rounded bg-red-600/90 px-1.5 py-0.5 text-xs text-white shadow group-hover:block"
                title="Hapus dari daftar (lokal)"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
