'use client'
import { useState } from 'react'

interface Props {
  token: string
  photoCount: number
  date: string
  envol: string
  succursaleLabel: string
  expiresAt: string
}

export default function DownloadClient({
  token,
  photoCount,
  date,
  envol,
  succursaleLabel,
  expiresAt,
}: Props) {
  const [copied, setCopied] = useState(false)

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

            {/* Bouton téléchargement */}
            <a
              href={`/api/download-zip/${token}`}
              className="w-full flex items-center justify-center gap-3 bg-rouge hover:bg-gris-mid text-white rounded-xl px-4 py-4 font-bold text-base transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger mes photos
            </a>

            <p className="text-center text-xs text-gris-mid mt-3">
              {photoCount === 1 ? '1 photo' : `${photoCount} photos`} · fichier ZIP
            </p>

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
