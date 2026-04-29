'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SUCCURSALES = [
  { id: 'rive-sud',  label: 'Rive-Sud',  ville: 'Farnham'    },
  { id: 'rive-nord', label: 'Rive-Nord', ville: 'St-Esprit'  },
]

export default function HomePage() {
  const router = useRouter()
  const [succursale, setSuccursale] = useState('')
  const [date, setDate]             = useState('')
  const [envol, setEnvol]           = useState('')
  const [error, setError]           = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!succursale) {
      setError('Veuillez sélectionner votre centre de saut.')
      return
    }
    if (!date || !envol) {
      setError('Veuillez entrer la date et le numéro d\'envolée.')
      return
    }
    const envolNum = parseInt(envol, 10)
    if (isNaN(envolNum) || envolNum < 1 || envolNum > 30) {
      setError('Le numéro d\'envolée doit être entre 1 et 30.')
      return
    }
    router.push(`/tandem/galerie/${succursale}/${date}/${envolNum}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 bg-gray-50">

      {/* Hero */}
      <div className="text-center mb-8 max-w-md w-full">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight text-navy">
          Vous avez sauté.<br />
          <span className="text-action">On a tout capturé.</span>
        </h1>
        <p className="text-mid text-base sm:text-lg">
          Choisissez votre centre, entrez la date et votre numéro d&apos;envolée pour retrouver vos photos.
        </p>
      </div>

      {/* Formulaire */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 w-full max-w-md"
      >
        <div className="space-y-5">

          {/* Succursale — cartes larges, faciles à tapper */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Centre de saut
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SUCCURSALES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSuccursale(s.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all duration-200 min-h-[72px] ${
                    succursale === s.id
                      ? 'border-action bg-pale-blue'
                      : 'border-gray-200 hover:border-gray-400 active:border-action bg-white'
                  }`}
                >
                  <p className={`font-bold text-sm leading-tight ${succursale === s.id ? 'text-action' : 'text-navy'}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-mid mt-1">{s.ville}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date du saut
            </label>
            {/* type="date" s'ouvre comme un sélecteur natif sur mobile — idéal */}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field text-base" /* text-base évite le zoom auto sur iOS */
              required
            />
          </div>

          {/* Numéro d'envolée */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numéro d&apos;envolée
            </label>
            <input
              type="number"
              inputMode="numeric" /* Clavier numérique sur mobile */
              value={envol}
              onChange={(e) => setEnvol(e.target.value)}
              placeholder="Ex : 3"
              min="1"
              max="30"
              className="input-field text-base"
              required
            />
            <p className="text-xs text-mid mt-1">
              Ce numéro vous a été communiqué au centre lors de votre saut.
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Bouton large, facile à tapper sur mobile */}
          <button
            type="submit"
            className="btn-primary w-full text-center py-4 text-base"
          >
            Voir mes photos →
          </button>
        </div>
      </form>

      <p className="mt-6 text-sm text-mid text-center max-w-sm px-4">
        Les photos sont disponibles le soir même de votre saut et pendant 30 jours.
      </p>
    </div>
  )
}
