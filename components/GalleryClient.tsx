'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import type { Photo } from '@/lib/types'
import {
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  photoBadgePrice,
  FIRST_PHOTO_PRICE_CENTS,
  ADDITIONAL_PHOTO_PRICE_CENTS,
} from '@/lib/pricing'

interface GalleryClientProps {
  photos: Photo[]
  date: string
  envol: string
  location: string
}

export default function GalleryClient({
  photos,
  date,
  envol,
  location,
}: GalleryClientProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading]   = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [cartZoomIndex, setCartZoomIndex] = useState<number | null>(null)

  const openLightbox  = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goToPrev = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null))
  }, [photos.length])

  const goToNext = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null))
  }, [photos.length])

  // Navigation clavier : ← → Échap
  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  goToPrev()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'Escape')     closeLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, goToPrev, goToNext])

  // Swipe mobile dans la lightbox
  const touchStartX = useRef<number | null>(null)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) {
      delta < 0 ? goToNext() : goToPrev()
    }
    touchStartX.current = null
  }

  function togglePhoto(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll()  { setSelected(new Set(photos.map((p) => p.id))) }
  function clearAll()   { setSelected(new Set()) }

  async function handleCheckout() {
    if (selected.size === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: Array.from(selected), location, date, envol }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Erreur lors du paiement. Réessayez.')
        setLoading(false)
      }
    } catch {
      alert('Erreur réseau. Vérifiez votre connexion.')
      setLoading(false)
    }
  }

  const subtotalCents  = calculateSubtotal(selected.size)
  const taxCents       = calculateTax(subtotalCents)
  const totalCents     = subtotalCents + taxCents
  const fmt = (cents: number) => (cents / 100).toFixed(2)

  // Photos sélectionnées dans l'ordre de la galerie (pour le lightbox du panier)
  const selectedPhotos = photos.filter((p) => selected.has(p.id))

  const cartTouchStartX = useRef<number | null>(null)
  function handleCartTouchStart(e: React.TouchEvent) {
    cartTouchStartX.current = e.touches[0].clientX
  }
  function handleCartTouchEnd(e: React.TouchEvent) {
    if (cartTouchStartX.current === null || cartZoomIndex === null) return
    const delta = e.changedTouches[0].clientX - cartTouchStartX.current
    if (Math.abs(delta) > 50) {
      if (delta < 0) setCartZoomIndex((i) => i !== null ? (i + 1) % selectedPhotos.length : null)
      else           setCartZoomIndex((i) => i !== null ? (i - 1 + selectedPhotos.length) % selectedPhotos.length : null)
    }
    cartTouchStartX.current = null
  }

  return (
    <>
      {/* Barre de sélection */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-4">
          {/* Cibles de tap généreuses (min 44px) */}
          <button
            onClick={selectAll}
            className="text-sm text-action font-medium py-2"
          >
            Tout sélectionner
          </button>
          {selected.size > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-mid py-2"
            >
              Désélectionner
            </button>
          )}
        </div>
        <span className="text-sm text-mid">
          {photos.length} photo{photos.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Grille — 2 colonnes sur mobile, 3 sur tablette, 4 sur desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-32">
        {photos.map((photo) => {
          const isSelected = selected.has(photo.id)
          return (
            <div
              key={photo.id}
              className={`group relative aspect-[3/2] rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-gris-mid shadow-md shadow-gris-mid/20'
                  : 'border-transparent'
              }`}
              onClick={() => togglePhoto(photo.id)}
            >
              <Image
                src={photo.url}
                alt={photo.filename}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />

              {/* Coche de sélection */}
              {isSelected && (
                <div className="absolute inset-0 bg-gris-mid/15 flex items-start justify-end p-2">
                  <div className="bg-action rounded-full w-7 h-7 flex items-center justify-center shadow">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Prix — toujours visible, dynamique selon la sélection en cours */}
              {!isSelected && (
                <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-xs text-white px-1.5 py-0.5 rounded font-medium">
                  {photoBadgePrice(selected.size)}
                </div>
              )}

              {/* Bouton agrandir — visible sur desktop (hover), tappable sur mobile */}
              <button
                onClick={(e) => { e.stopPropagation(); openLightbox(photos.indexOf(photo)) }}
                className="absolute top-1.5 right-1.5 bg-black/60 text-white p-2 rounded-full sm:opacity-0 sm:group-hover:opacity-100 active:bg-black/80"
                title="Agrandir"
                aria-label="Agrandir la photo"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* Barre de panier — fixe en bas */}
      {selected.size > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-navy px-4 py-3 z-50 safe-area-bottom"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">
                {selected.size} photo{selected.size > 1 ? 's' : ''} sélectionnée{selected.size > 1 ? 's' : ''}
              </p>
              <p className="text-white/70 text-xs leading-tight">
                Sous-total {fmt(subtotalCents)} $ + taxes {fmt(taxCents)} $
              </p>
              <p className="text-white font-bold text-base">{fmt(totalCents)} $ CAD</p>
              <p className="text-white/50 text-[10px] leading-tight mt-1">
                En payant, vous acceptez nos{' '}
                <a href="/conditions" className="underline hover:text-white/80" target="_blank" rel="noopener noreferrer">
                  conditions d&apos;utilisation
                </a>
              </p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setShowCart(true) }}
              disabled={loading}
              className="btn-primary whitespace-nowrap flex-shrink-0 py-3 px-5 text-sm"
            >
              Réviser ma commande →
            </button>
          </div>
        </div>
      )}

      {/* Modale de révision de commande */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black/60 z-[90] flex items-end sm:items-center justify-center"
          onClick={() => setShowCart(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-navy font-bold text-lg mb-4">Révision de ma commande</h2>

            {/* Vignettes des photos sélectionnées */}
            <div className="flex flex-wrap gap-2 mb-5">
              {selectedPhotos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setCartZoomIndex(idx)}
                  className="group relative w-20 h-14 rounded-lg overflow-hidden border border-gray-200 hover:border-action transition-colors focus:outline-none focus:ring-2 focus:ring-action"
                  title="Agrandir"
                >
                  <Image src={p.url} alt={p.filename} fill className="object-cover" sizes="80px" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            {/* Détail du prix */}
            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm mb-5">
              <div className="flex justify-between text-gray-600">
                <span>{selected.size} photo{selected.size > 1 ? 's' : ''}</span>
                <span>{fmt(subtotalCents)} $</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TPS 5 % + TVQ 9,975 %</span>
                <span>{fmt(taxCents)} $</span>
              </div>
              <div className="flex justify-between text-navy font-bold text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{fmt(totalCents)} $ CAD</span>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary w-full mb-3"
            >
              {loading ? 'Chargement...' : 'Payer →'}
            </button>
            <button
              onClick={() => setShowCart(false)}
              className="btn-secondary w-full"
            >
              ← Continuer à magasiner
            </button>

            <p className="text-[10px] text-mid text-center mt-3">
              En payant, vous acceptez nos{' '}
              <a href="/conditions" className="underline" target="_blank" rel="noopener noreferrer">
                conditions d&apos;utilisation
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Lightbox du panier — navigation complète avec swipe et flèches */}
      {cartZoomIndex !== null && (() => {
        const photo = selectedPhotos[cartZoomIndex]
        return (
          <div
            className="fixed inset-0 bg-black/95 z-[110] flex flex-col"
            onClick={() => setCartZoomIndex(null)}
            onTouchStart={handleCartTouchStart}
            onTouchEnd={handleCartTouchEnd}
          >
            {/* Barre du haut */}
            <div
              className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-white/70 text-sm font-medium">
                {cartZoomIndex + 1} / {selectedPhotos.length}
              </p>
              <button
                className="text-white bg-black/50 p-3 rounded-full active:bg-black/80"
                onClick={() => setCartZoomIndex(null)}
                aria-label="Fermer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Zone image + flèches */}
            <div className="flex-1 relative flex items-center justify-center min-h-0">
              {/* Flèche gauche */}
              {selectedPhotos.length > 1 && (
                <button
                  className="absolute left-2 sm:left-4 text-white bg-black/50 hover:bg-black/80 p-3 rounded-full z-10 transition-colors active:bg-black/80"
                  onClick={(e) => { e.stopPropagation(); setCartZoomIndex((i) => i !== null ? (i - 1 + selectedPhotos.length) % selectedPhotos.length : null) }}
                  aria-label="Photo précédente"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Flèche droite */}
              {selectedPhotos.length > 1 && (
                <button
                  className="absolute right-2 sm:right-4 text-white bg-black/50 hover:bg-black/80 p-3 rounded-full z-10 transition-colors active:bg-black/80"
                  onClick={(e) => { e.stopPropagation(); setCartZoomIndex((i) => i !== null ? (i + 1) % selectedPhotos.length : null) }}
                  aria-label="Photo suivante"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Image */}
              <div
                className="relative w-full h-full mx-14 sm:mx-20"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={photo.url}
                  alt={photo.filename}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            </div>

            {/* Bas */}
            <div className="flex-shrink-0 pb-8 pt-3 text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-white/30 text-xs">
                {selectedPhotos.length > 1 ? 'Glisser pour naviguer · ' : ''}Appuyer ailleurs pour fermer
              </p>
            </div>
          </div>
        )
      })()}

      {/* Lightbox */}
      {lightboxIndex !== null && (() => {
        const photo = photos[lightboxIndex]
        const isCurrentSelected = selected.has(photo.id)
        // Prix à afficher si on sélectionne cette photo
        // (basé sur le nb de photos déjà sélectionnées, photo courante exclue si déjà dedans)
        const selectionCountWithout = isCurrentSelected ? selected.size - 1 : selected.size
        const addPrice = photoBadgePrice(selectionCountWithout)

        return (
          <div
            className="fixed inset-0 bg-black/95 z-[100] flex flex-col"
            onClick={closeLightbox}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Barre du haut : compteur + fermer */}
            <div
              className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-white/70 text-sm font-medium">
                {lightboxIndex + 1} / {photos.length}
              </p>
              <button
                className="text-white bg-black/50 p-3 rounded-full active:bg-black/80"
                onClick={closeLightbox}
                aria-label="Fermer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Zone image + flèches — flex-1 pour occuper tout l'espace disponible */}
            <div className="flex-1 relative flex items-center justify-center min-h-0">

              {/* Flèche gauche */}
              <button
                className="absolute left-2 sm:left-4 text-white bg-black/50 hover:bg-black/80 p-3 rounded-full z-10 transition-colors"
                onClick={(e) => { e.stopPropagation(); goToPrev() }}
                aria-label="Photo précédente"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Flèche droite */}
              <button
                className="absolute right-2 sm:right-4 text-white bg-black/50 hover:bg-black/80 p-3 rounded-full z-10 transition-colors"
                onClick={(e) => { e.stopPropagation(); goToNext() }}
                aria-label="Photo suivante"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Image */}
              <div
                className="relative w-full h-full mx-14 sm:mx-20"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={photo.url}
                  alt={photo.filename}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            </div>

            {/* Bas : bouton sélection + hint */}
            <div
              className="flex-shrink-0 px-4 pt-3 pb-6 flex flex-col items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => togglePhoto(photo.id)}
                className={`w-full max-w-sm min-h-[56px] rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-colors active:opacity-80 ${
                  isCurrentSelected
                    ? 'bg-green-500 text-white'
                    : 'bg-action text-white'
                }`}
              >
                {isCurrentSelected ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Sélectionnée · Appuyer pour retirer
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Sélectionner · {addPrice}
                  </>
                )}
              </button>

              <p className="text-white/30 text-xs">
                Glisser pour naviguer · Appuyer ailleurs pour fermer
              </p>
            </div>
          </div>
        )
      })()}
    </>
  )
}
