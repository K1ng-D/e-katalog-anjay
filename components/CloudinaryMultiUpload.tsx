'use client'
import { useState } from 'react'

type Props = {
  onUploaded?: (urls: string[]) => void
  onUploadingChange?: (v: boolean) => void   // ← tambahkan prop ini
  maxFiles?: number
}

export default function CloudinaryUploadApiMulti({
  onUploaded,
  onUploadingChange,
  maxFiles = 8,
}: Props) {
  const [urls, setUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setLoading(true)
    onUploadingChange?.(true)          // ← beri tahu parent: mulai upload
    setError(null)

    try {
      const form = new FormData()
      files.slice(0, maxFiles).forEach((f) => form.append('files', f)) // key harus 'files'

      const res = await fetch('/api/cloudinary/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Upload gagal')

      const merged = [...urls, ...(data.urls as string[])]
      setUrls(merged)
      onUploaded?.(merged ?? [])       // jangan kirim undefined
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      onUploadingChange?.(false)       // ← selesai upload
    }
  }

  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" multiple onChange={handleChange} />
      {loading && <div>Mengupload…</div>}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {urls.map((u) => (
            <a key={u} href={u} target="_blank" rel="noreferrer">
              <img src={u} alt="uploaded" className="w-full h-24 object-cover rounded" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
