'use client'

import { useState } from 'react'

// ── Données fictives ────────────────────────────────────────────────────────
const DEMO_FLIGHTS = [
  { envol: '1', photoCount: 12, published: true },
  { envol: '2', photoCount: 8,  published: false },
  { envol: '3', photoCount: 15, published: false },
]

// Photos fictives (images libres de droit via picsum)
const makePhotos = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `demo-${i}`,
    filename: `DSC_${String(i + 1).padStart(4, '0')}.jpg`,
    url: `https://picsum.photos/seed/${i + 42}/400/300`,
  }))

// ── Vue : liste des envolées ────────────────────────────────────────────────
function FlightList({ onSelect, flights, setFlights }: {
  onSelect: (flight: typeof DEMO_FLIGHTS[0]) => void
  flights: typeof DEMO_FLIGHTS
  setFlights: React.Dispatch<React.SetStateAction<typeof DEMO_FLIGHTS>>
}) {
  const published = flights.filter((f) => f.published).length
  const total = flights.length
  const percent = Math.round((published / total) * 100)
  const allDone = published === total

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Gestion des galeries</h1>
          <p className="text-sm text-mid mt-1">Démo — Rive-Sud · 15 avril 2026</p>
        </div>
        <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-3 py-1 rounded-full">Mode démo</span>
      </div>

      {/* Sélecteur (affiché mais non fonctionnel en démo) */}
      <div className="bg-pale-blue rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button className="py-3 rounded-lg text-sm font-semibold bg-action text-white">Rive-Sud</button>
          <button className="py-3 rounded-lg text-sm font-semibold bg-white text-navy">Rive-Nord</button>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            defaultValue="2026-04-15"
            className="input-field flex-1"
            readOnly
          />
          <button className="btn-primary px-6">Voir →</button>
        </div>
      </div>

      {/* Barre de progression */}
      <div className={`rounded-2xl p-5 mb-6 border ${allDone ? 'bg-green-50 border-green-200' : 'bg-white border-pale-blue'}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-navy">{published} / {total}</span>
            <span className="text-sm text-mid ml-2">envolées publiées</span>
          </div>
          {!allDone && (
            <button
              onClick={() => {
                setFlights((prev) => prev.map((f) => ({ ...f, published: true })))
              }}
              className="text-sm font-semibold text-white bg-action px-4 py-2 rounded-lg hover:bg-action/90 transition-colors whitespace-nowrap"
            >
              ✓ Tout publier
            </button>
          )}
          {allDone && (
            <span className="text-sm font-semibold text-green-600">✓ Journée complète!</span>
          )}
        </div>

        {/* Barre */}
        <div className="w-full bg-pale-blue rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${allDone ? 'bg-green-500' : 'bg-action'}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex justify-between mt-2">
          {flights.map((f) => (
            <div key={f.envol} className="flex flex-col items-center gap-1">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${f.published ? (allDone ? 'bg-green-500' : 'bg-action') : 'bg-pale-blue border border-mid/30'}`} />
              <span className="text-xs text-mid">{f.envol}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des envolées */}
      <div className="space-y-3">
        <p className="text-sm text-mid mb-2">{flights.length} envolées trouvées</p>
        {flights.map((flight) => (
          <button
            key={flight.envol}
            onClick={() => onSelect(flight)}
            className="w-full flex items-center justify-between bg-white border border-pale-blue rounded-xl px-5 py-4 hover:border-action transition-colors text-left"
          >
            <div>
              <span className="font-semibold text-navy">Envolée {flight.envol}</span>
              <span className="text-mid text-sm ml-3">{flight.photoCount} photos</span>
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
    </div>
  )
}

// ── Vue : gestion d'une envolée ─────────────────────────────────────────────
function FlightDetail({
  flight,
  onBack,
  onPublishChange,
}: {
  flight: typeof DEMO_FLIGHTS[0]
  onBack: () => void
  onPublishChange: (envol: string, value: boolean) => void
}) {
  const [photos, setPhotos] = useState(makePhotos(flight.photoCount))
  const [deletedId, setDeletedId] = useState<string | null>(null)

  function handleDelete(id: string, filename: string) {
    if (!confirm(`Supprimer "${filename}" définitivement?`)) return
    setDeletedId(id)
    setTimeout(() => {
      setPhotos((prev) => prev.filter((p) => p.id !== id))
      setDeletedId(null)
    }, 600)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* En-tête */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <button onClick={onBack} className="text-sm text-mid hover:text-action mb-2 inline-block transition-colors">
            ← Retour
          </button>
          <h1 className="text-2xl font-bold text-navy">
            Envolée {flight.envol} — Rive-Sud
          </h1>
          <p className="text-mid text-sm mt-1">15 avril 2026 · {photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Statut + approbation */}
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            flight.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {flight.published ? '✓ Publiée' : '⏳ Brouillon'}
          </span>
          {flight.published ? (
            <button
              onClick={() => onPublishChange(flight.envol, false)}
              className="text-sm text-mid hover:text-red-500 transition-colors"
            >
              Retirer la publication
            </button>
          ) : (
            <button
              onClick={() => onPublishChange(flight.envol, true)}
              disabled={photos.length === 0}
              className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ✓ Approuver et publier
            </button>
          )}
        </div>
      </div>

      {/* Message de statut */}
      {flight.published ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 text-sm text-green-700">
          ✓ Cette galerie est visible par les clients.
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">
          ⏳ Brouillon — les clients ne peuvent pas encore voir ces photos.
        </div>
      )}

      {/* Grille de photos */}
      {photos.length === 0 ? (
        <div className="text-center py-12 bg-pale-blue rounded-2xl text-mid mb-6">
          Toutes les photos ont été supprimées.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`relative group rounded-xl overflow-hidden bg-pale-blue aspect-square transition-opacity ${
                deletedId === photo.id ? 'opacity-30' : 'opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
              {/* Overlay au survol */}
              <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/20 transition-colors" />
              {/* Bouton supprimer */}
              <button
                onClick={() => handleDelete(photo.id, photo.filename)}
                className="absolute top-2 right-2 bg-red-600 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow"
                title="Supprimer cette photo"
              >
                ✕
              </button>
              {/* Nom au survol */}
              <div className="absolute bottom-0 left-0 right-0 bg-navy/70 text-white text-xs px-2 py-1 translate-y-full group-hover:translate-y-0 transition-transform truncate">
                {photo.filename}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone d'ajout */}
      <div className="border-2 border-dashed border-action/30 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-navy mb-4">Ajouter des photos</h2>
        <div className="border-2 border-dashed border-pale-blue rounded-xl p-8 text-center cursor-pointer hover:border-action transition-colors">
          <p className="text-mid text-sm">
            Glissez des photos ou{' '}
            <span className="text-action font-medium">cliquez pour sélectionner</span>
          </p>
          <p className="text-xs text-mid mt-1">JPG, PNG, WebP · Watermark appliqué automatiquement</p>
        </div>
      </div>

      <p className="text-xs text-mid text-center mt-8">Mode démo — aucune donnée réelle</p>
    </div>
  )
}

// ── Page principale ─────────────────────────────────────────────────────────
export default function GestionDemo() {
  const [flights, setFlights] = useState(DEMO_FLIGHTS)
  const [selectedFlight, setSelectedFlight] = useState<typeof DEMO_FLIGHTS[0] | null>(null)

  function handlePublishChange(envol: string, value: boolean) {
    setFlights((prev) => prev.map((f) => f.envol === envol ? { ...f, published: value } : f))
    setSelectedFlight((prev) => prev?.envol === envol ? { ...prev, published: value } : prev)
  }

  if (selectedFlight) {
    return (
      <FlightDetail
        flight={flights.find((f) => f.envol === selectedFlight.envol) ?? selectedFlight}
        onBack={() => setSelectedFlight(null)}
        onPublishChange={handlePublishChange}
      />
    )
  }

  return <FlightList onSelect={setSelectedFlight} flights={flights} setFlights={setFlights} />
}
