'use client'
// Composant client pour la page de téléchargement.
// Gère : "Copier le lien", "Tout télécharger", et le bouton individuel par photo.
import { useState } from 'react'

interface DownloadItem {
  id: string
  downloadUrl: string
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
  const [downloadingAll, setDownloadingAll] = useState(false)

  const pageUrl = typeof window !== 'undefined'
    ? window.location.href
    : `${process.env.NEXT_PUBLIC_BASE_URL}/tandem/download/${token}`

  // Formater la date d'expiration
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
      // Fallback pour les navigateurs sans clipboard API
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

  async function handleDownloadAll() {
    setDownloadingAll(true)
    // Ouvrir chaque lien avec un délai pour éviter le blocage du navigateur
    for (let i = 0; i < downloads.length; i++) {
      const a = document.createElement('a')
      a.href = downloads[i].downloadUrl
      a.download = downloads[i].filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Délai entre chaque téléchargement
      if (i < downloads.length - 1) {
        await new Promise((res) => setTimeout(res, 800))
      }
    }
    setDownloadingAll(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">

      {/* En-tête confirmation */}
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

      {/* Carte principale */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">

        {/* Bouton tout télécharger — en haut */}
        {downloads.length > 1 && (
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="w-full flex items-center justify-center gap-2 bg-navy text-white rounded-xl px-4 py-3.5 font-semibold text-sm hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60"
          >
            {downloadingAll ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Téléchargement en cours...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tout télécharger ({downloads.length} photos)
              </>
            )}
          </button>
        )}

        {/* Avertissement expiration — sous le bouton Tout télécharger */}
        <div className="bg-pale-blue border border-action rounded-xl px-4 py-3 text-center">
          <p className="text-navy font-bold text-base">
            ⏰ ATTENTION ⏰
          </p>
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
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-action text-white hover:opacity-90'
              }`}
            >
              {copied ? '✓ Copié !' : 'Copier'}
            </button>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Boutons individuels */}
        <div>
          <h2 className="font-semibold text-navy text-sm mb-3">
            {downloads.length === 1 ? 'Télécharger votre photo' : 'Télécharger photo par photo'}
          </h2>
          <div className="space-y-2">
            {downloads.map((dl, i) => (
              <a
                key={dl.id}
                href={dl.downloadUrl}
                download={dl.filename}
                className="flex items-center justify-between bg-gray-50 hover:bg-pale-blue active:bg-pale-blue border border-gray-200 rounded-xl px-4 py-3 min-h-[52px] transition-colors"
              >
                <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                  Photo {i + 1}
                </span>
                <span className="text-action text-sm font-semibold flex items-center gap-1 flex-shrink-0">
                  Télécharger
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </div>

      </div>

      <p className="text-center text-sm text-mid mt-8">
        Merci d&apos;avoir choisi l&apos;équipe de Ma Photo Tandem ! 🪂 🫶
      </p>
    </div>
  )
}
