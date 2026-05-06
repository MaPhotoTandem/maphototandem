'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SUCCURSALES = [
  { id: 'rive-sud',  label: 'Rive-Sud',  ville: 'Farnham'    },
  { id: 'rive-nord', label: 'Rive-Nord', ville: 'St-Esprit'  },
]

// ── Mini-chat : retrouver son envolée ────────────────────────────────────────

type ChatStep = 'date' | 'location' | 'name' | 'result'

interface ChatMatch { envol: string }

function FlightFinder({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step, setStep]           = useState<ChatStep>('date')
  const [chatDate, setChatDate]   = useState('')
  const [chatLoc, setChatLoc]     = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading]     = useState(false)
  const [matches, setMatches]     = useState<ChatMatch[]>([])
  const [noResult, setNoResult]   = useState(false)

  async function searchFlight() {
    setLoading(true)
    setNoResult(false)
    const res = await fetch(
      `/api/search-flight?location=${chatLoc}&date=${chatDate}&firstName=${encodeURIComponent(firstName)}`
    )
    const data = await res.json()
    setLoading(false)
    if (res.ok && data.matches?.length > 0) {
      setMatches(data.matches)
      setStep('result')
    } else {
      setNoResult(true)
    }
  }

  function goToGallery(envol: string) {
    onClose()
    router.push(`/tandem/galerie/${chatLoc}/${chatDate}/${envol}`)
  }

  // Messages du "robot"
  const messages: Record<ChatStep, string> = {
    date:     '📅 Quelle est la date de ton saut ?',
    location: '📍 Quel centre as-tu visité ?',
    name:     '👤 Quel est ton prénom ?',
    result:   matches.length === 1
      ? `🎉 On a trouvé ton envolée !`
      : `🎉 On a trouvé ${matches.length} envolées avec ce prénom. Laquelle est la tienne ?`,
  }

  return (
    <div className="fixed inset-0 bg-navy/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden">

        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="font-semibold text-navy text-sm">Retrouver mon envolée</span>
          </div>
          <button
            onClick={onClose}
            className="text-mid hover:text-navy transition-colors text-xl leading-none"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Corps du chat */}
        <div className="px-5 py-5 space-y-4 min-h-[220px]">

          {/* Message robot */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-pale-blue flex items-center justify-center text-sm flex-shrink-0">
              📷
            </div>
            <div className="bg-pale-blue rounded-2xl rounded-tl-none px-4 py-3 text-sm text-navy font-medium max-w-[80%]">
              {messages[step]}
            </div>
          </div>

          {/* Étape : Date */}
          {step === 'date' && (
            <div className="flex gap-2 pl-11">
              <input
                type="date"
                value={chatDate}
                onChange={(e) => setChatDate(e.target.value)}
                className="input-field flex-1 text-base"
              />
              <button
                onClick={() => chatDate && setStep('location')}
                disabled={!chatDate}
                className="btn-primary px-4 disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}

          {/* Étape : Location */}
          {step === 'location' && (
            <div className="pl-11 grid grid-cols-2 gap-3">
              {SUCCURSALES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setChatLoc(s.id); setStep('name') }}
                  className="rounded-xl border-2 border-gray-200 hover:border-action active:border-action p-3 text-left transition-all"
                >
                  <p className="font-bold text-sm text-navy">{s.label}</p>
                  <p className="text-xs text-mid">{s.ville}</p>
                </button>
              ))}
            </div>
          )}

          {/* Étape : Prénom */}
          {step === 'name' && (
            <div className="flex gap-2 pl-11">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && firstName.length >= 2 && searchFlight()}
                placeholder="Ex : Sabrina"
                className="input-field flex-1 text-base"
                autoFocus
                autoComplete="given-name"
              />
              <button
                onClick={searchFlight}
                disabled={firstName.length < 2 || loading}
                className="btn-primary px-4 disabled:opacity-40"
              >
                {loading ? '...' : '→'}
              </button>
            </div>
          )}

          {/* Résultats */}
          {step === 'result' && (
            <div className="pl-11 space-y-2">
              {matches.map(({ envol }) => (
                <button
                  key={envol}
                  onClick={() => goToGallery(envol)}
                  className="w-full flex items-center justify-between bg-pale-blue hover:bg-action/10 border border-action/20 rounded-xl px-4 py-3 transition-colors"
                >
                  <span className="font-semibold text-navy text-sm">Envolée {envol}</span>
                  <span className="text-action text-sm font-medium">Voir mes photos →</span>
                </button>
              ))}
            </div>
          )}

          {/* Aucun résultat */}
          {noResult && step === 'name' && (
            <div className="pl-11">
              <p className="text-sm text-red-500">
                Aucune envolée trouvée pour ce prénom. Vérifiez la date, le centre et le prénom. Essayez le nom de famille. Pour de l&apos;aide, contactez-nous à{' '}
                <a
                  href="mailto:maphototandem@parachutemontreal.com"
                  className="underline"
                >
                  maphototandem@parachutemontreal.com
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Pied — recommencer */}
        {(step === 'result' || step === 'name') && (
          <div className="px-5 pb-5 pt-0">
            <button
              onClick={() => { setStep('date'); setChatDate(''); setChatLoc(''); setFirstName(''); setMatches([]); setNoResult(false) }}
              className="text-xs text-mid hover:text-navy underline transition-colors"
            >
              ← Recommencer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const [succursale, setSuccursale] = useState('')
  const [date, setDate]             = useState('')
  const [envol, setEnvol]           = useState('')
  const [error, setError]           = useState('')
  const [showFinder, setShowFinder] = useState(false)

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

      {showFinder && <FlightFinder onClose={() => setShowFinder(false)} />}

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

          {/* Succursale */}
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
            <div className="w-full overflow-hidden border border-gray-300 rounded-lg bg-white focus-within:border-action transition-colors">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 text-black focus:outline-none text-base bg-transparent border-0"
                style={{ maxWidth: '100%', minWidth: '0', boxSizing: 'border-box' }}
                required
              />
            </div>
          </div>

          {/* Numéro d'envolée */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numéro d&apos;envolée
            </label>
            <input
              type="number"
              inputMode="numeric"
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
            <button
              type="button"
              onClick={() => setShowFinder(true)}
              className="mt-2 text-sm text-action font-medium hover:underline transition-colors"
            >
              Vous avez perdu votre numéro d&apos;envolée ?
            </button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="btn-primary w-full text-center py-4 text-base"
          >
            Voir mes photos →
          </button>
        </div>
      </form>

      <p className="mt-4 text-sm text-mid text-center max-w-sm px-4">
        Les photos sont disponibles le soir même de votre saut et pendant 30 jours.
      </p>

      {/* Bouton flottant */}
      <button
        onClick={() => setShowFinder(true)}
        className="fixed bottom-6 right-6 bg-action text-white rounded-full shadow-lg px-4 py-3 text-sm font-semibold flex items-center gap-2 hover:bg-action/90 transition-colors z-40"
        aria-label="Retrouver mon envolée"
      >
        <span>💬</span>
        <span className="hidden sm:inline">Retrouver mon envolée</span>
      </button>
    </div>
  )
}
