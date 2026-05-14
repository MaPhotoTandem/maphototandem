'use client'

import { useState } from 'react'

type Appareil = 'iphone' | 'android' | 'mac' | 'pc'

const APPAREILS: { id: Appareil; label: string; icon: React.ReactNode }[] = [
  {
    id: 'iphone',
    label: 'iPhone',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 1H7C5.9 1 5 1.9 5 3v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm-5 20c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5-3H7V4h10v14z"/>
      </svg>
    ),
  },
  {
    id: 'android',
    label: 'Android',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.523 15.341a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m-9.546 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0M3.513 9h16.974A2.5 2.5 0 0 1 23 11.5v1A2.5 2.5 0 0 1 20.487 15H3.513A2.5 2.5 0 0 1 1 12.5v-1A2.5 2.5 0 0 1 3.513 9zM14.5 3.28l1.36-2.356a.25.25 0 0 0-.433-.25L14.05 3.07A7.5 7.5 0 0 0 12 2.75a7.5 7.5 0 0 0-2.05.32L8.573.674a.25.25 0 0 0-.433.25L9.5 3.28A7.52 7.52 0 0 0 4.5 9.5h15a7.52 7.52 0 0 0-5-6.22z"/>
      </svg>
    ),
  },
  {
    id: 'mac',
    label: 'Mac',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
      </svg>
    ),
  },
  {
    id: 'pc',
    label: 'PC Windows',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
      </svg>
    ),
  },
]

const ETAPES: Record<Appareil, { titre: string; etapes: string[]; note?: string }> = {
  iphone: {
    titre: 'Télécharger sur iPhone',
    etapes: [
      'Sur la page de téléchargement, appuie sur le bouton rouge "Enregistrer dans Photos".',
      'Le téléphone charge tes photos pendant quelques secondes. Le bouton affiche "Chargement des photos…".',
      'L\'interface de partage iOS s\'ouvre automatiquement avec toutes tes photos.',
      'Appuie sur "Enregistrer l\'image" ou "Enregistrer X images". Toutes tes photos sont sauvegardées dans ta pellicule en une seule fois.',
    ],
    note: 'Si le bouton "Enregistrer dans Photos" ne fonctionne pas, appuie sur "Réessayer". Si ça ne fonctionne toujours pas, des liens individuels "Photo 1", "Photo 2", etc. apparaissent juste en dessous pour télécharger chaque photo séparément.',
  },
  android: {
    titre: 'Télécharger sur Android',
    etapes: [
      'Sur la page de téléchargement, appuie sur le bouton rouge "Enregistrer dans Photos".',
      'Le téléphone charge tes photos pendant quelques secondes. Le bouton affiche "Chargement des photos…".',
      'L\'interface de partage Android s\'ouvre avec toutes tes photos.',
      'Sélectionne "Enregistrer" ou "Enregistrer dans la galerie". Tes photos sont sauvegardées directement.',
    ],
    note: 'Si le bouton "Enregistrer dans Photos" n\'apparaît pas sur ton téléphone, des liens individuels "Photo 1", "Photo 2", etc. sont disponibles juste en dessous. Appuie sur chaque lien, la photo s\'ouvre en plein écran. Appuie longuement sur l\'image et sélectionne "Enregistrer dans la galerie" ou "Télécharger l\'image".',
  },
  mac: {
    titre: 'Télécharger sur Mac',
    etapes: [
      'Sur la page de téléchargement, clique sur le bouton "Télécharger en ZIP".',
      'Le fichier ZIP se télécharge dans ton dossier Téléchargements.',
      'Une fois terminé, ouvre ton dossier Téléchargements depuis le Finder ou la barre d\'outils de Safari.',
      'Double-clique sur le fichier ZIP. macOS l\'extrait automatiquement et crée un dossier avec toutes tes photos.',
      'Tes photos sont prêtes. Tu peux les glisser dans l\'app Photos, iCloud Drive, ou n\'importe quel autre endroit.',
    ],
  },
  pc: {
    titre: 'Télécharger sur PC Windows',
    etapes: [
      'Sur la page de téléchargement, clique sur le bouton "Télécharger en ZIP".',
      'Le fichier ZIP se télécharge. Une barre de progression apparaît en bas de ton navigateur (Chrome ou Edge) ou dans les notifications.',
      'Une fois terminé, clique sur le fichier dans la barre du navigateur, ou ouvre l\'Explorateur de fichiers et va dans Téléchargements.',
      'Fais un clic droit sur le fichier ZIP et sélectionne "Extraire tout".',
      'Choisis un dossier de destination, par exemple le Bureau, puis clique sur "Extraire".',
      'Tes photos apparaissent dans le dossier choisi, prêtes à être utilisées.',
    ],
    note: 'Sur Windows 11, tu peux aussi double-cliquer sur le fichier ZIP pour l\'ouvrir directement, puis faire glisser tes photos où tu veux.',
  },
}

export default function TelechargerAidePage() {
  const [actif, setActif] = useState<Appareil>('iphone')
  const contenu = ETAPES[actif]

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">

      {/* En-tête */}
      <div className="mb-10">
        <a href="/faq" className="text-sm text-gris-mid hover:text-noir transition-colors mb-4 inline-block">
          ← Retour à la FAQ
        </a>
        <h1 className="text-3xl sm:text-4xl font-bold text-noir mb-3">
          Comment télécharger mes photos ?
        </h1>
        <p className="text-gris-mid text-base">
          Sélectionne ton type d&apos;appareil pour voir les étapes.
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {APPAREILS.map((a) => (
          <button
            key={a.id}
            onClick={() => setActif(a.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              actif === a.id
                ? 'bg-rouge text-white'
                : 'bg-white border border-gris-bordure text-gris-mid hover:text-noir hover:border-noir'
            }`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="bg-white border border-gris-bordure rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-bold text-noir mb-6">{contenu.titre}</h2>

        <ol className="space-y-5">
          {contenu.etapes.map((etape, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 bg-rouge text-white rounded-full flex items-center justify-center text-sm font-bold">
                {i + 1}
              </span>
              <p className="text-gris-mid text-sm leading-relaxed pt-0.5">{etape}</p>
            </li>
          ))}
        </ol>

        {contenu.note && (
          <div className="mt-6 bg-gris-pale border border-gris-bordure rounded-xl px-4 py-3">
            <p className="text-sm text-gris-mid leading-relaxed">
              <span className="font-semibold text-noir">💡 Astuce : </span>
              {contenu.note}
            </p>
          </div>
        )}
      </div>

      {/* Pied de page */}
      <p className="text-center text-sm text-gris-mid mt-8">
        Tu as encore besoin d&apos;aide ?{' '}
        <a href="/contact" className="text-rouge hover:underline">Contacte-nous</a>.
      </p>

    </div>
  )
}
