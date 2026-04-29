'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getManagerSession, setManagerSession, getPhotographerSession, clearPhotographerSession, clearManagerSession } from '@/lib/manager-session'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Flight {
  envol: string
  photoCount: number
  published: boolean
  isPending?: boolean
}

interface Photo {
  id: string
  url: string
  filename: string
}

interface UploadFile {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

type View = 'dashboard' | 'flight'

const SUCCURSALES: Record<string, string> = {
  'rive-sud': 'Rive-Sud · Farnham',
  'rive-nord': 'Rive-Nord · St-Esprit',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Modal mot de passe gestionnaire ──────────────────────────────────────────

function ManagerModal({
  title,
  description,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  onConfirm: (pw: string) => Promise<boolean>
  onCancel: () => void
}) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await onConfirm(pw)
    setLoading(false)
    if (!ok) setError('Mot de passe incorrect.')
  }

  return (
    <div className="fixed inset-0 bg-navy/70 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-bold text-navy mb-1">{title}</h2>
        <p className="text-sm text-mid mb-5">{description}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="Mot de passe gestionnaire"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="input-field"
            autoFocus
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-40">
              {loading ? '...' : 'Confirmer →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function PhotographePage() {
  const router = useRouter()

  // Auth
  const [view, setView] = useState<View>('dashboard')
  const [authReady, setAuthReady] = useState(false)
  const [password, setPassword] = useState('')
  const [location, setLocation] = useState<'rive-sud' | 'rive-nord' | ''>('')

  // Dashboard
  const [date, setDate] = useState('')
  const [flights, setFlights] = useState<Flight[]>([])
  const [loadingFlights, setLoadingFlights] = useState(false)
  const [flightsLoaded, setFlightsLoaded] = useState(false)
  const [newEnvol, setNewEnvol] = useState('')

  // Flight detail
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  // Manager modal
  const [modal, setModal] = useState<{
    title: string
    description: string
    onConfirm: (pw: string) => Promise<boolean>
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Vérification de session au chargement ────────────────────────────────
  // Si aucune session valide → renvoyer vers /admin pour login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const loc = params.get('location') as 'rive-sud' | 'rive-nord' | null
    const validLoc = loc === 'rive-sud' || loc === 'rive-nord'

    // 1. Session gestionnaire active → accès direct sans mot de passe photographe
    const managerSession = getManagerSession()
    if (managerSession.valid && validLoc) {
      setPassword(managerSession.password)
      setLocation(loc!)
      setAuthReady(true)
      return
    }

    // 2. Session photographe active → restaurer le dashboard
    const photoSession = getPhotographerSession()
    if (photoSession) {
      setPassword(photoSession.password)
      setLocation(validLoc ? loc! : photoSession.location)
      setAuthReady(true)
      return
    }

    // 3. Aucune session → retour à /admin pour login
    router.replace('/admin')
  }, [router])

  function logout() {
    clearPhotographerSession()
    clearManagerSession()
    router.push('/admin')
  }

  // ── Charger les envolées ──────────────────────────────────────────────────

  async function loadFlights() {
    if (!date) return
    setLoadingFlights(true)
    setFlightsLoaded(false)
    setFlights([])
    const res = await fetch(
      `/api/admin/flights?location=${location}&date=${date}`,
      { headers: { 'x-admin-password': password } }
    )
    const data = await res.json()
    setLoadingFlights(false)
    setFlightsLoaded(true)
    if (res.ok) setFlights(data.flights ?? [])
  }

  // ── Créer une nouvelle envolée ────────────────────────────────────────────

  function handleCreateFlight(e: React.FormEvent) {
    e.preventDefault()
    const num = newEnvol.trim()
    if (!num || isNaN(Number(num))) return
    if (flights.some((f) => f.envol === num)) {
      alert(`L'envolée ${num} existe déjà pour cette date.`)
      return
    }
    const newFlight: Flight = { envol: num, photoCount: 0, published: false, isPending: true }
    const updated = [...flights, newFlight].sort((a, b) => Number(a.envol) - Number(b.envol))
    setFlights(updated)
    setNewEnvol('')
    openFlight(newFlight)
  }

  // ── Ouvrir une envolée ────────────────────────────────────────────────────

  async function openFlight(flight: Flight) {
    setSelectedFlight(flight)
    setPhotos([])
    setUploadFiles([])
    setView('flight')
    if (!flight.isPending) {
      setLoadingPhotos(true)
      const res = await fetch(
        `/api/admin/photos?location=${location}&date=${date}&envol=${flight.envol}`,
        { headers: { 'x-admin-password': password } }
      )
      const data = await res.json()
      setLoadingPhotos(false)
      if (res.ok) setPhotos(data.photos ?? [])
    }
  }

  function backToDashboard() {
    setView('dashboard')
    setSelectedFlight(null)
    setPhotos([])
    setUploadFiles([])
  }

  // ── Supprimer une photo ───────────────────────────────────────────────────

  async function handleDelete(filename: string) {
    if (!confirm(`Supprimer "${filename}" définitivement?`)) return
    setDeleting(filename)
    const res = await fetch('/api/admin/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ location, date, envol: selectedFlight?.envol, filename }),
    })
    setDeleting(null)
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.filename !== filename))
      setFlights((prev) => prev.map((f) =>
        f.envol === selectedFlight?.envol ? { ...f, photoCount: Math.max(0, f.photoCount - 1) } : f
      ))
    } else {
      alert('Erreur lors de la suppression.')
    }
  }

  // ── Upload photos ─────────────────────────────────────────────────────────

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const images = Array.from(newFiles).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
    setUploadFiles((prev) => [...prev, ...images.map((f) => ({ file: f, status: 'pending' as const }))])
  }

  async function createWebVersion(file: File): Promise<Blob> {
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
          const ls = Math.min((w * 0.8) / logo.width, (h * 0.8) / logo.height)
          const lw = logo.width * ls; const lh = logo.height * ls
          ctx.globalAlpha = 0.55
          ctx.drawImage(logo, (w - lw) / 2, (h - lh) / 2, lw, lh)
          ctx.globalAlpha = 1
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', 0.88)
        }
        logo.onerror = () => reject(new Error('Logo introuvable'))
        logo.src = '/watermark.png'
      }
      img.onerror = () => reject(new Error('Image invalide'))
      img.src = URL.createObjectURL(file)
    })
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
          body: JSON.stringify({ location, date, envol: selectedFlight?.envol, filename: item.file.name }),
        })
        if (!res.ok) throw new Error('Erreur API')
        const { webUrl, originalUrl } = await res.json()
        const webBlob = await createWebVersion(item.file)
        const [webRes, origRes] = await Promise.all([
          fetch(webUrl, { method: 'PUT', body: webBlob, headers: { 'Content-Type': 'image/jpeg' } }),
          fetch(originalUrl, { method: 'PUT', body: item.file, headers: { 'Content-Type': item.file.type || 'image/jpeg' } }),
        ])
        if (!webRes.ok || !origRes.ok) throw new Error('Erreur R2')
        setUploadFiles((prev) => prev.map((f, i) => i === item.idx ? { ...f, status: 'done' } : f))
        setFlights((prev) => prev.map((f) =>
          f.envol === selectedFlight?.envol
            ? { ...f, isPending: false, photoCount: f.photoCount + 1 }
            : f
        ))
        if (selectedFlight?.isPending) setSelectedFlight((prev) => prev ? { ...prev, isPending: false } : prev)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue'
        setUploadFiles((prev) => prev.map((f, i) => i === item.idx ? { ...f, status: 'error', error: msg } : f))
      }
    }
    setUploading(false)
    // Recharger les photos depuis R2
    const res = await fetch(
      `/api/admin/photos?location=${location}&date=${date}&envol=${selectedFlight?.envol}`,
      { headers: { 'x-admin-password': password } }
    )
    if (res.ok) { const data = await res.json(); setPhotos(data.photos ?? []) }
  }

  // ── Publication (protégée par mot de passe gestionnaire) ─────────────────

  async function doPublish(envolees: string[], value: boolean, pw: string): Promise<boolean> {
    const first = await fetch('/api/admin/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-manager-password': pw },
      body: JSON.stringify({ location, date, envol: envolees[0], published: value }),
    })
    if (first.status === 401) return false
    if (!first.ok) return false
    if (envolees.length > 1) {
      await Promise.all(
        envolees.slice(1).map((e) =>
          fetch('/api/admin/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-manager-password': pw },
            body: JSON.stringify({ location, date, envol: e, published: value }),
          })
        )
      )
    }
    setFlights((prev) => prev.map((f) =>
      envolees.includes(f.envol) ? { ...f, published: value } : f
    ))
    if (selectedFlight && envolees.includes(selectedFlight.envol)) {
      setSelectedFlight((prev) => prev ? { ...prev, published: value } : prev)
    }
    return true
  }

  function askPublish(envolees: string[], value: boolean) {
    // Vérifier la session 5 minutes — pas besoin de re-saisir le mot de passe
    const session = getManagerSession()
    if (session.valid) {
      doPublish(envolees, value, session.password)
      return
    }

    const count = envolees.length
    setModal({
      title: value ? 'Approuver et publier' : 'Retirer la publication',
      description: value
        ? count > 1
          ? `Publier les ${count} envolées de la journée? Entrez votre mot de passe gestionnaire.`
          : `Publier l'envolée ${envolees[0]}? Entrez votre mot de passe gestionnaire.`
        : `Retirer la publication de l'envolée ${envolees[0]}? Entrez votre mot de passe gestionnaire.`,
      onConfirm: async (pw: string) => {
        const ok = await doPublish(envolees, value, pw)
        if (!ok) return false
        setManagerSession(pw) // Démarrer la session 5 minutes
        setModal(null)
        return true
      },
    })
  }

  // ── Pendant la vérification de session : ne rien afficher ─────────────────

  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] text-mid text-sm">
        Chargement...
      </div>
    )
  }

  // ── VUE : Dashboard ───────────────────────────────────────────────────────

  const unpublishedFlights = flights.filter((f) => !f.published && !f.isPending)
  const realFlights = flights.filter((f) => !f.isPending)
  const publishedCount = realFlights.filter((f) => f.published).length
  const totalCount = realFlights.length

  if (view === 'dashboard') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">
              {SUCCURSALES[location] ?? location}
            </h1>
            <p className="text-sm text-mid mt-1">Sélectionnez une date pour gérer les envolées.</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin/gestion"
              className="text-sm font-semibold text-action hover:text-action/80 transition-colors"
            >
              Gestion →
            </a>
            <button onClick={logout} className="text-sm text-mid hover:text-navy transition-colors">
              Déconnexion
            </button>
          </div>
        </div>

        {/* Sélecteur de date */}
        <div className="bg-pale-blue rounded-2xl p-6 mb-6">
          <label className="block text-sm font-semibold text-navy mb-2">Date</label>
          <div className="flex gap-3">
            <input
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => { setDate(e.target.value); setFlightsLoaded(false); setFlights([]) }}
              className="input-field flex-1"
            />
            <button
              onClick={loadFlights}
              disabled={!date || loadingFlights}
              className="btn-primary px-6 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingFlights ? 'Chargement...' : 'Voir →'}
            </button>
          </div>
          {date && date < new Date().toISOString().split('T')[0] && (
            <p className="text-amber-600 text-xs font-medium mt-2">
              ⚠️ Date passée — les envolées créées ici seront ajoutées rétroactivement.
            </p>
          )}
        </div>

        {/* Résultats */}
        {flightsLoaded && (
          <>
            {/* Barre de progression */}
            {totalCount > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-navy">
                    Envolées publiées
                  </span>
                  <span className="text-sm text-mid">
                    {publishedCount} / {totalCount}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-pale-blue rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      publishedCount === totalCount ? 'bg-green-500' : 'bg-action'
                    }`}
                    style={{ width: `${(publishedCount / totalCount) * 100}%` }}
                  />
                </div>
                {publishedCount === totalCount && (
                  <p className="text-xs text-green-600 mt-1">✓ Toutes les envolées sont publiées.</p>
                )}
              </div>
            )}

            {/* Bouton Tout publier */}
            {unpublishedFlights.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-4">
                <p className="text-sm text-amber-800">
                  <strong>{unpublishedFlights.length} envolée{unpublishedFlights.length > 1 ? 's' : ''}</strong> en brouillon pour le {formatDate(date)}.
                </p>
                <button
                  onClick={() => askPublish(unpublishedFlights.map((f) => f.envol), true)}
                  className="text-sm font-semibold text-white bg-action px-4 py-2 rounded-lg hover:bg-action/90 transition-colors whitespace-nowrap"
                >
                  ✓ Tout publier
                </button>
              </div>
            )}

            {/* Liste des envolées */}
            {flights.length === 0 ? (
              <p className="text-center text-mid py-8">Aucune envolée pour cette date.</p>
            ) : (
              <div className="space-y-2 mb-6">
                <p className="text-sm text-mid mb-3">
                  {flights.length} envolée{flights.length > 1 ? 's' : ''}
                </p>
                {flights.map((flight) => (
                  <button
                    key={flight.envol}
                    onClick={() => openFlight(flight)}
                    className="w-full flex items-center justify-between bg-white border border-pale-blue rounded-xl px-5 py-4 hover:border-action transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-navy">Envolée {flight.envol}</span>
                      {flight.isPending ? (
                        <span className="text-xs text-mid italic">nouvelle — aucune photo</span>
                      ) : (
                        <span className="text-mid text-sm">{flight.photoCount} photo{flight.photoCount > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      flight.published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {flight.published ? '✓ Publiée' : '⏳ Brouillon'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Créer une nouvelle envolée */}
            <div className="border border-dashed border-action/30 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-navy mb-3">Créer une nouvelle envolée</h2>
              <form onSubmit={handleCreateFlight} className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  placeholder="N° d'envolée (ex: 4)"
                  value={newEnvol}
                  onChange={(e) => setNewEnvol(e.target.value)}
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary px-5">
                  Créer →
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── VUE : Gestion d'une envolée ───────────────────────────────────────────

  const pendingCount = uploadFiles.filter((f) => f.status === 'pending').length
  const doneCount = uploadFiles.filter((f) => f.status === 'done').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {modal && (
        <ManagerModal
          title={modal.title}
          description={modal.description}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      {/* En-tête */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <button onClick={backToDashboard} className="text-sm text-mid hover:text-action mb-2 inline-block transition-colors">
            ← Retour
          </button>
          <h1 className="text-2xl font-bold text-navy">
            Envolée {selectedFlight?.envol}
          </h1>
          <p className="text-mid text-sm mt-1">
            {SUCCURSALES[location] ?? location} · {date && formatDate(date)} · {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Statut + Approuver */}
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            selectedFlight?.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {selectedFlight?.published ? '✓ Publiée' : '⏳ Brouillon'}
          </span>
          {selectedFlight?.published ? (
            <button
              onClick={() => askPublish([selectedFlight.envol], false)}
              className="text-sm text-mid hover:text-red-500 transition-colors"
            >
              Retirer la publication
            </button>
          ) : (
            <button
              onClick={() => selectedFlight && askPublish([selectedFlight.envol], true)}
              disabled={photos.length === 0}
              className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ✓ Approuver et publier
            </button>
          )}
        </div>
      </div>

      {/* Bannière de statut */}
      {selectedFlight?.published ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 text-sm text-green-700">
          ✓ Galerie visible par les clients.
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">
          ⏳ Brouillon — les clients ne voient pas encore ces photos.
        </div>
      )}

      {/* Grille de photos */}
      {loadingPhotos ? (
        <div className="text-center py-12 text-mid">Chargement des photos...</div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 bg-pale-blue rounded-2xl text-mid mb-6">
          Aucune photo — ajoutez-en ci-dessous.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`relative group rounded-xl overflow-hidden bg-pale-blue aspect-square transition-opacity ${
                deleting === photo.filename ? 'opacity-30' : 'opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/20 transition-colors" />
              <button
                onClick={() => handleDelete(photo.filename)}
                className="absolute top-2 right-2 bg-red-600 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow"
                title="Supprimer"
              >
                ✕
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-navy/70 text-white text-xs px-2 py-1 translate-y-full group-hover:translate-y-0 transition-transform truncate">
                {photo.filename}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone d'upload */}
      <div className="border-2 border-dashed border-action/30 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-navy mb-4">Ajouter des photos</h2>

        <div
          className="border-2 border-dashed border-pale-blue rounded-xl p-8 text-center cursor-pointer hover:border-action transition-colors mb-4"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
        >
          <p className="text-mid text-sm">
            Glissez des photos ou{' '}
            <span className="text-action font-medium">cliquez pour sélectionner</span>
          </p>
          <p className="text-xs text-mid mt-1">JPG, PNG, WebP · Watermark appliqué automatiquement</p>
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
                <div key={i} className={`flex items-center justify-between rounded-lg px-4 py-2 ${
                  f.status === 'done' ? 'bg-green-50 border border-green-200' : 'bg-pale-blue'
                }`}>
                  <span className="text-sm text-navy truncate flex-1 mr-2">{f.file.name}</span>
                  <span className={`text-xs font-semibold ${
                    f.status === 'done' ? 'text-green-600'
                    : f.status === 'error' ? 'text-red-500'
                    : f.status === 'uploading' ? 'text-action'
                    : 'text-mid'
                  }`}>
                    {f.status === 'done' ? '✓ Envoyée'
                    : f.status === 'error' ? `✗ ${f.error ?? 'Erreur'}`
                    : f.status === 'uploading' ? 'Traitement...'
                    : 'En attente'}
                  </span>
                </div>
              ))}
            </div>

            {/* Bannière succès quand tout est envoyé */}
            {pendingCount === 0 && !uploading && doneCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-green-700">
                  ✓ {doneCount} photo{doneCount > 1 ? 's' : ''} envoyée{doneCount > 1 ? 's' : ''} avec succès !
                </p>
                <button onClick={backToDashboard} className="text-sm font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap">
                  Envolée suivante →
                </button>
              </div>
            )}

            {pendingCount === 0 && !uploading && doneCount === 0 && null}

            <div className="flex items-center justify-between">
              <p className="text-sm text-mid">
                {doneCount} / {uploadFiles.length} envoyée{uploadFiles.length > 1 ? 's' : ''}
              </p>
              {pendingCount > 0 && !uploading && (
                <button onClick={uploadAll} className="btn-primary">
                  Envoyer {pendingCount} photo{pendingCount > 1 ? 's' : ''} →
                </button>
              )}
              {uploading && <span className="text-action text-sm">Envoi en cours...</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
