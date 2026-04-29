'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getManagerSession } from '@/lib/manager-session'

interface Photo {
  id: string
  url: string
  filename: string
}

const SUCCURSALES: Record<string, string> = {
  'rive-sud': 'Rive-Sud',
  'rive-nord': 'Rive-Nord',
}

export default function GestionEnvolee() {
  const params = useParams()
  const router = useRouter()

  const location = params.location as string
  const date = params.date as string
  const envol = params.envol as string
  const [password, setPassword] = useState('')

  const [photos, setPhotos] = useState<Photo[]>([])
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<{ file: File; status: 'pending' | 'uploading' | 'done' | 'error' }[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Charger les photos ───────────────────────────────────────────────────
  async function loadPhotosWithPw(pw: string) {
    setLoading(true)
    setError('')
    const res = await fetch(
      `/api/admin/photos?location=${location}&date=${date}&envol=${envol}`,
      { headers: { 'x-manager-password': pw } }
    )
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Erreur serveur.'); return }
    setPhotos(data.photos)
  }

  async function loadPhotos() { loadPhotosWithPw(password) }

  // ── Vérifier le statut de publication ───────────────────────────────────
  async function loadPublishStatusWithPw(pw: string) {
    const res = await fetch(
      `/api/admin/flights?location=${location}&date=${date}`,
      { headers: { 'x-manager-password': pw } }
    )
    if (!res.ok) return
    const data = await res.json()
    const flight = data.flights?.find((f: { envol: string; published: boolean }) => f.envol === envol)
    if (flight) setPublished(flight.published)
  }

  useEffect(() => {
    const managerSession = getManagerSession()
    const pw = sessionStorage.getItem('managerPassword')
      || (managerSession.valid ? managerSession.password : '')
    if (!pw) { router.push('/admin/photographe'); return }
    setPassword(pw)
    loadPhotosWithPw(pw)
    loadPublishStatusWithPw(pw)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Supprimer une photo ──────────────────────────────────────────────────
  async function handleDelete(filename: string) {
    if (!confirm(`Supprimer "${filename}" définitivement?`)) return
    setDeleting(filename)
    const res = await fetch('/api/admin/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-manager-password': password },
      body: JSON.stringify({ location, date, envol, filename }),
    })
    setDeleting(null)
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.filename !== filename))
    } else {
      alert('Erreur lors de la suppression.')
    }
  }

  // ── Approuver / retirer ──────────────────────────────────────────────────
  async function handlePublish(value: boolean) {
    setPublishing(true)
    const res = await fetch('/api/admin/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-manager-password': password },
      body: JSON.stringify({ location, date, envol, published: value }),
    })
    setPublishing(false)
    if (res.ok) setPublished(value)
    else alert('Erreur lors du changement de statut.')
  }

  // ── Ajouter des photos (réutilise la logique d'upload existante) ─────────
  async function createWebVersion(file: File, logoUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const logo = new Image()
      img.onload = () => {
        const MAX = 1920
        const scale = Math.min(1, MAX / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        logo.onload = () => {
          const logoScale = Math.min((w * 0.8) / logo.width, (h * 0.8) / logo.height)
          const lw = logo.width * logoScale; const lh = logo.height * logoScale
          ctx.globalAlpha = 0.4
          ctx.drawImage(logo, (w - lw) / 2, (h - lh) / 2, lw, lh)
          ctx.globalAlpha = 1
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', 0.88)
        }
        logo.onerror = () => reject(new Error('Logo introuvable'))
        logo.src = logoUrl
      }
      img.onerror = () => reject(new Error('Image invalide'))
      img.src = URL.createObjectURL(file)
    })
  }

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const images = Array.from(newFiles).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
    setUploadFiles((prev) => [...prev, ...images.map((f) => ({ file: f, status: 'pending' as const }))])
  }

  async function uploadAll() {
    setUploading(true)
    const pending = uploadFiles.map((f, i) => ({ ...f, idx: i })).filter((f) => f.status === 'pending')
    for (const item of pending) {
      setUploadFiles((prev) => prev.map((f, i) => i === item.idx ? { ...f, status: 'uploading' } : f))
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify({ location, date, envol, filename: item.file.name }),
        })
        if (!res.ok) throw new Error('Erreur API')
        const { webUrl, originalUrl } = await res.json()
        const webBlob = await createWebVersion(item.file, '/watermark.png')
        const [webRes, origRes] = await Promise.all([
          fetch(webUrl, { method: 'PUT', body: webBlob, headers: { 'Content-Type': 'image/jpeg' } }),
          fetch(originalUrl, { method: 'PUT', body: item.file, headers: { 'Content-Type': item.file.type || 'image/jpeg' } }),
        ])
        if (!webRes.ok || !origRes.ok) throw new Error('Erreur R2')
        setUploadFiles((prev) => prev.map((f, i) => i === item.idx ? { ...f, status: 'done' } : f))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue'
        setUploadFiles((prev) => prev.map((f, i) => i === item.idx ? { ...f, status: 'error', error: msg } : f))
      }
    }
    setUploading(false)
    await loadPhotos()
  }

  const succursaleLabel = SUCCURSALES[location] ?? location

  // ── Rendu ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-mid">
        Chargement...
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => router.back()} className="btn-secondary">← Retour</button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* En-tête */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <button onClick={() => router.back()} className="text-sm text-mid hover:text-action mb-2 inline-block">
            ← Retour
          </button>
          <h1 className="text-2xl font-bold text-navy">
            Envolée {envol} — {succursaleLabel}
          </h1>
          <p className="text-mid text-sm mt-1">{date} · {photos.length} photo{photos.length > 1 ? 's' : ''}</p>
        </div>

        {/* Statut + bouton d'approbation */}
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {published ? '✓ Publiée' : '⏳ Brouillon'}
          </span>
          {published ? (
            <button
              onClick={() => handlePublish(false)}
              disabled={publishing}
              className="text-sm text-mid hover:text-red-500 transition-colors disabled:opacity-40"
            >
              {publishing ? '...' : 'Retirer la publication'}
            </button>
          ) : (
            <button
              onClick={() => handlePublish(true)}
              disabled={publishing || photos.length === 0}
              className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {publishing ? 'En cours...' : '✓ Approuver et publier'}
            </button>
          )}
        </div>
      </div>

      {/* Grille de photos */}
      {photos.length === 0 ? (
        <div className="text-center py-12 bg-pale-blue rounded-2xl text-mid mb-6">
          Aucune photo dans cette envolée.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-pale-blue aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleDelete(photo.filename)}
                disabled={deleting === photo.filename}
                className="absolute top-2 right-2 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                title="Supprimer"
              >
                ✕
              </button>
              {deleting === photo.filename && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs">Suppression...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ajouter des photos */}
      <div className="border border-dashed border-action/40 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-navy mb-4">Ajouter des photos</h2>
        <div
          className="border-2 border-dashed border-pale-blue rounded-xl p-8 text-center cursor-pointer hover:border-action transition-colors mb-4"
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-mid text-sm">
            Glissez des photos ou{' '}
            <span className="text-action font-medium">cliquez pour sélectionner</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {uploadFiles.length > 0 && (
          <>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {uploadFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-pale-blue rounded-lg px-4 py-2">
                  <span className="text-sm text-navy truncate flex-1 mr-2">{f.file.name}</span>
                  <span className={`text-xs font-medium ${
                    f.status === 'done' ? 'text-green-600'
                    : f.status === 'error' ? 'text-red-500'
                    : f.status === 'uploading' ? 'text-action'
                    : 'text-mid'
                  }`}>
                    {f.status === 'done' ? '✓ Envoyée'
                    : f.status === 'error' ? '✗ Erreur'
                    : f.status === 'uploading' ? 'Traitement...'
                    : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
            {uploadFiles.some((f) => f.status === 'pending') && !uploading && (
              <button onClick={uploadAll} className="btn-primary w-full">
                Envoyer {uploadFiles.filter((f) => f.status === 'pending').length} photo{uploadFiles.filter((f) => f.status === 'pending').length > 1 ? 's' : ''} →
              </button>
            )}
            {uploading && <p className="text-action text-sm text-center">Envoi en cours...</p>}
            {uploadFiles.every((f) => f.status === 'done') && (
              <button onClick={() => setUploadFiles([])} className="btn-secondary w-full text-sm">
                Prêt pour d&apos;autres photos
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
