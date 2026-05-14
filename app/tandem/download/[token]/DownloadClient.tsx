'use client'

import { useState, useEffect } from 'react'

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
  const [shareSupported, setShareSupported] = useState<boolean | null>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  const photoCount = downloads.length

  const pageUrl = typeof window !== 'undefined'
    ? window.location.href
    : `${process.env.NEXT_PUBLIC_BASE_URL}/tandem/download/${token}`

  const expiresDate = new Date(expiresAt)
  const expiresFormatted = expiresDate.toLocaleDateString('fr-CA', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  // Vérifier le support du Web Share API avec fichiers au chargement
  useEffect(() => {
    const testFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
    setShareSupported(
      typeof navigator !== 'undefined' &&
      !!navigator.canShare &&
      navigator.canShare({ files: [testFile] })
    )
  }, [])

  async function handleSharePhotos() {
    setShareStatus('loading')
    try {
      const files = await Promise.all(
        downloads.map(async (photo, idx) => {
          const response = await fetch(photo.displayUrl)
          const blob = await response.blob()
          return new File([blob], `photo-${idx + 1}.jpg`, { type: 'image/jpeg' })
        })
      )
      await navigator.share({
        files,
        title: 'Mes photos Ma Photo Tandem',
      })
      setShareStatus('idle')
    } catch (err) {
      // L'utilisateur a annulé — pas une vraie erreur
      if (err instanceof Error && err.name === 'AbortError') {
        setShareStatus('idle')
      } else {
        console.error('Erreur Web Share:', err)
        setShareStatus('error')
      }
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl)
    } catch {
      const input = document.createElement('input')
      input.value = pageUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gris-pale flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-sm text-gris-mid font-medium tracking-wide uppercase">Ma Photo Tandem</p>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-sm border border-gris-bordure overflow-hidden">

          {/* Bandeau expiration */}
          <div className="bg-rouge px-5 py-3 flex items-center gap-2.5">
            <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white text-sm font-bold">
              Lien valide pendant 72 heures ({expiresFormatted})
            </p>
          </div>

          {/* Contenu */}
          <div className="px-6 py-8">

            {/* Titre */}
            <h1 className="text-2xl font-bold text-noir mb-1 text-center">
              {photoCount === 1 ? 'Votre photo est prête' : `Vos ${photoCount} photos sont prêtes`}
            </h1>
            <p className="text-gris-mid text-sm mb-8 text-center">
              Envolée {envol} · {date} · {succursaleLabel}
            </p>

            {/* Bouton Web Share — mobile moderne */}
            {shareSupported && (
              <div className="mb-4">
                <button
                  onClick={handleSharePhotos}
                  disabled={shareStatus === 'loading'}
                  className="w-full flex items-center justify-center gap-3 bg-rouge hover:bg-gris-mid disabled:opacity-60 text-white rounded-xl px-4 py-4 font-bold text-base transition-colors"
                >
                  {shareStatus === 'loading' ? (
                    <>
                      <svg className="w-5 h-5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Chargement des photos…
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Enregistrer dans Photos
                    </>
                  )}
                </button>
                {shareStatus === 'error' && (
                  <p className="text-xs text-rouge mt-2 text-center">
                    Une erreur est survenue. Utilise les liens individuels plus bas pour télécharger tes photos une par une.
                  </p>
                )}
                <p className="text-center text-xs text-gris-mid mt-2">
                  {photoCount === 1 ? '1 photo' : `${photoCount} photos`} · sauvegarde directe dans ta pellicule
                </p>
              </div>
            )}

            {/* Bouton ZIP — toujours visible, mis en retrait sur mobile si Web Share dispo */}
            <a
              href={`/api/download-zip/${token}`}
              className={`w-full flex items-center justify-center gap-3 rounded-xl px-4 py-4 font-bold text-base transition-colors ${
                shareSupported
                  ? 'bg-gris-pale border border-gris-bordure text-gris-mid hover:border-noir hover:text-noir text-sm'
                  : 'bg-rouge hover:bg-gris-mid text-white'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {shareSupported ? 'Télécharger en ZIP (ordinateur)' : 'Télécharger mes photos'}
            </a>
            {!shareSupported && (
              <p className="text-center text-xs text-gris-mid mt-2 mb-2">
                {photoCount === 1 ? '1 photo' : `${photoCount} photos`} · fichier ZIP
              </p>
            )}

            {/* Liens individuels — fallback si Web Share non supporté ou en erreur */}
            {(shareSupported === false || shareStatus === 'error') && (
              <div className="bg-gris-pale border border-gris-bordure rounded-xl p-4 mt-4">
                <p className="text-xs font-semibold text-noir mb-3 uppercase tracking-wide">
                  Sur téléphone
                </p>
                <p className="text-xs text-gris-mid mb-4 leading-relaxed">
                  Appuie sur chaque photo, elle s&apos;ouvre en plein écran. Appuie longuement → <strong>Enregistrer dans Photos</strong>.
                </p>
                <div className="space-y-2">
                  {downloads.map((photo, idx) => (
                    <a
                      key={photo.id}
                      href={photo.displayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between bg-white border border-gris-bordure hover:border-noir rounded-lg px-4 py-3 transition-colors"
                    >
                      <span className="text-sm font-medium text-noir">Photo {idx + 1}</span>
                      <svg className="w-4 h-4 text-gris-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Séparateur */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gris-bordure" />
              <span className="text-xs text-gris-mid">Partager ce lien</span>
              <div className="flex-1 h-px bg-gris-bordure" />
            </div>

            {/* Copier le lien */}
            <p className="text-sm text-gris-mid mb-3">
              Vos proches peuvent aussi télécharger les photos grâce à ce lien :
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={pageUrl}
                className="flex-1 text-xs bg-gris-pale border border-gris-bordure rounded-lg px-3 py-2.5 text-gris-mid truncate focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-noir text-white hover:bg-gris-mid'
                }`}
              >
                {copied ? '✓ Copié' : 'Copier'}
              </button>
            </div>

          </div>
        </div>

        {/* Pied de page */}
        <div className="text-center mt-6 space-y-1">
          <a href="/aide/telecharger" className="text-sm text-gris-mid hover:text-noir underline underline-offset-2 transition-colors">
            Besoin d&apos;aide pour télécharger ?
          </a>
          <p className="text-xs text-gris-mid">
            Parachute Montréal · Rive-Sud (Farnham) &amp; Rive-Nord (St-Esprit)
          </p>
        </div>

      </div>
    </div>
  )
}
