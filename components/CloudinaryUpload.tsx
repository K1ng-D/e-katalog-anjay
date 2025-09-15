// components/CloudinaryUpload.tsx
'use client'
import { useState } from 'react'

type Props = { cloudName: string; uploadPreset: string; onUploaded?: (url: string) => void }

export default function CloudinaryUpload({ cloudName, uploadPreset, onUploaded }: Props) {
const [url, setUrl] = useState<string | null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
const file = e.target.files?.[0]
if (!file) return
setLoading(true)
setError(null)
try {
const form = new FormData()
form.append('file', file)
form.append('upload_preset', uploadPreset) // unsigned preset
const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: 'POST', body: form })
const json = await res.json()
setUrl(json.secure_url)
onUploaded?.(json.secure_url)
} catch (e: any) {
setError(e.message)
} finally {
setLoading(false)
}
}

return (
<div className="space-y-2">
<input type="file" accept="image/*" onChange={handleChange} />
{loading && <div>Uploading…</div>}
{error && <div className="text-red-600 text-sm">{error}</div>}
{url && (
<a href={url} target="_blank" className="text-blue-600 underline" rel="noreferrer">View uploaded image</a>
)}
</div>
)
}