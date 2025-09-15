'use client'
import { useState } from 'react'

export default function CloudinaryUploadApi({ onUploaded }: { onUploaded?: (url: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload gagal')
      setUrl(data.url)
      onUploaded?.(data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" onChange={handleChange} />
      {loading && <p>Uploading…</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
          Lihat Gambar
        </a>
      )}
    </div>
  )
}
