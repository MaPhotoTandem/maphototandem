'use client'
// Composant client pour la page de téléchargement.
// Gère : affichage des photos, "Copier le lien", téléchargement ZIP, boutons individuels.
import { useState } from 'react'

interface DownloadItem {
  id: string
  downloadUrl: string
  displayUrl: string
  filename: string
}

interface Props {
  token: string
  downloads: DownloadItem[]
  date: string
  envol: string
  succursaleLabel: string
  expiresAt: string
}

export default function DownloadClient({
  token,
  downloads,
  date,
  envol,
  succursaleLabel,
  expiresAt,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const pageUrl = typeof window !== 'undefined'
    ? window.location.href
    : `${process.env.NEXT_PUBLIC_BASE_URL}/tandem/download/${token}`

  const expiresDate = new Date(expiresAt)
  const expiresFormatted = expiresDate.toLocaleDateString('fr-CA', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const input = document.createElement('input')
      input.value = pageUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">

      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-navy">
          {downloads.length === 1 ? 'Votre photo est prête !' : 'Vos photos sont prêtes !'}
        </h1>
        <p className="text-mid text-sm sm:text-base">
          Envolée {envol} · {date} · {succursaleLabel}
        </p>
      </div>

      {/* Instruction mobile — long press */}
      <div className="sm:hidden bg-pale-blue border border-action/30 rounded-xl px-4 py-3 mb-5 flex gap-3 items-start">
        <span className="text-xl mt-0.5">💡</span>
        <p className="text-navy text-sm leading-snug">
          <strong>Appuyez longuement sur une photo</strong> puis sélectionnez{' '}
          <strong>«&nbsp;Enregistrer l&apos;image&nbsp;»</strong> pour l&apos;ajouter à votre pellicule.
        </p>
      </div>

      {/* Grille de photos */}
      <div className={`grid gap-3 mb-6 ${downloads.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {downloads.map((photo, idx) => (
          <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-[3/2]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.displayUrl}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover"
              loading={idx === 0 ? 'eager' : 'lazy'}
            />

            {/* Bouton agrandir — desktop uniquement */}
            <button
              onClick={() => setLightboxIndex(idx)}
              className="hidden sm:flex absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center"
              aria-label="Agrandir"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" />
              </svg>
            </button>

            {/* Bouton télécharger individuel — desktop uniquement */}
            <a
              href={photo.downloadUrl}
              download={photo.filename}
              className="hidden sm:flex absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger
            </a>
          </div>
        ))}
      </div>

      {/* Carte actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">

        {/* Bouton ZIP */}
        <a
          href={`/api/download-zip/${token}`}
          className="w-full flex items-center justify-center gap-3 bg-action text-white rounded-xl px-4 py-5 font-bold text-lg hover:opacity-90 active:opacity-80 transition-opacity shadow-md"
        >
          <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>
            TÉLÉCHARGER TOUT EN ZIP
            <span className="block text-sm font-normal opacity-80">
              {downloads.length} {downloads.length === 1 ? 'photo' : 'photos'} · idéal sur ordinateur
            </span>
          </span>
        </a>

        {/* Avertissement expiration */}
        <div className="bg-pale-blue border border-action rounded-xl px-4 py-3 text-center">
          <p className="text-navy font-bold text-base">⏰ ATTENTION ⏰</p>
          <p className="text-navy font-semibold text-sm mt-0.5">
            Ce lien est valide pendant 72 heures.{' '}
            <span className="font-normal text-mid">(jusqu&apos;au {expiresFormatted})</span>
          </p>
        </div>

        <hr className="border-gray-100" />

        {/* Copier le lien */}
        <div>
          <p className="text-sm text-mid mb-2">
            Partagez ce lien avec vos proches pour qu&apos;ils téléchargent les photos aussi :
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={pageUrl}
              className="flex-1 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-600 truncate focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                copied ? 'bg-green-100 text-green-700' : 'bg-action text-white hover:opacity-90'
              }`}
            >
              {copied ? '✓ Copié !' : 'Copier'}
            </button>
          </div>
        </div>

      </div>

      <p className="text-center text-sm text-mid mt-8">
        Merci d&apos;avoir choisi l&apos;équipe de Ma Photo Tandem ! 🪂 🫶
      </p>

      {/* Lightbox desktop */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 p-3 rounded-full"
            onClick={() => setLightboxIndex(null)}
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 text-white bg-black/50 p-3 rounded-full"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
              aria-label="Précédent"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {lightboxIndex < downloads.length - 1 && (
            <button
              className="absolute right-4 text-white bg-black/50 p-3 rounded-full"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
              aria-label="Suivant"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div className="max-w-4xl max-h-[90vh] px-16" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={downloads[lightboxIndex].displayUrl}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
