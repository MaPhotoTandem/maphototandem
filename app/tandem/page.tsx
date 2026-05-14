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
    <div className="fixed inset-0 bg-noir/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden">

        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="font-semibold text-noir text-sm">Retrouver mon envolée</span>
          </div>
          <button
            onClick={onClose}
            className="text-gris-mid hover:text-noir transition-colors text-xl leading-none"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Corps du chat */}
        <div className="px-5 py-5 space-y-4 min-h-[220px]">

          {/* Message robot */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gris-pale flex items-center justify-center text-sm flex-shrink-0">
              📷
            </div>
            <div className="bg-gris-pale rounded-2xl rounded-tl-none px-4 py-3 text-sm text-noir font-medium max-w-[80%]">
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
                  className="rounded-xl border-2 border-gray-200 hover:border-rouge active:border-rouge p-3 text-left transition-all"
                >
                  <p className="font-bold text-sm text-noir">{s.label}</p>
                  <p className="text-xs text-gris-mid">{s.ville}</p>
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
                  className="w-full flex items-center justify-between bg-gris-pale hover:bg-rouge/10 border border-rouge/20 rounded-xl px-4 py-3 transition-colors"
                >
                  <span className="font-semibold text-noir text-sm">Envolée {envol}</span>
                  <span className="text-rouge text-sm font-medium">Voir mes photos →</span>
                </button>
              ))}
            </div>
          )}

          {/* Aucun résultat */}
          {noResult && step === 'name' && (
            <div className="pl-11">
              <p className="text-sm text-red-500">
                Aucune envolée trouvée. Vérifiez la date et le centre, puis essayez votre nom de famille ou les variantes les plus communes de votre prénom (ex : Marc / Mark). Pour de l&apos;aide, contactez-nous à{' '}
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
              className="text-xs text-gris-mid hover:text-noir underline transition-colors"
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
  const [showHelpMenu, setShowHelpMenu] = useState(false)

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
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight text-noir">
          Vous avez sauté.<br />
          <span className="text-rouge">On a tout capturé.</span>
        </h1>
        <p className="text-gris-mid text-base sm:text-lg">
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
                      ? 'border-rouge bg-gris-pale'
                      : 'border-gray-200 hover:border-gray-400 active:border-rouge bg-white'
                  }`}
                >
                  <p className={`font-bold text-sm leading-tight ${succursale === s.id ? 'text-rouge' : 'text-noir'}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-gris-mid mt-1">{s.ville}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date du saut
            </label>
            <div className="w-full overflow-hidden border border-gray-300 rounded-lg bg-white focus-within:border-rouge transition-colors">
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
            <p className="text-xs text-gris-mid mt-1">
              Ce numéro vous a été communiqué au centre lors de votre saut.
            </p>
            <button
              type="button"
              onClick={() => setShowFinder(true)}
              className="mt-2 text-sm text-rouge font-medium hover:underline transition-colors"
            >
              J&apos;ai perdu mon numéro d&apos;envolée
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

      <p className="mt-4 text-sm text-gris-mid text-center max-w-sm px-4">
        Les photos sont disponibles le soir même de votre saut et pendant 30 jours.
      </p>

      {/* Bouton flottant + menu d'aide */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">

        {/* Menu */}
        {showHelpMenu && (
          <>
            {/* Overlay invisible pour fermer en cliquant ailleurs */}
            <div className="fixed inset-0 z-30" onClick={() => setShowHelpMenu(false)} />
            <div className="relative z-40 bg-white rounded-2xl shadow-xl overflow-hidden w-52 border border-gray-100">
              <button
                onClick={() => { setShowHelpMenu(false); setShowFinder(true) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-noir hover:bg-gris-pale transition-colors text-left"
              >
                <span>🔍</span> Retrouver mon envolée
              </button>
              <div className="border-t border-gray-100" />
              <a
                href="/faq"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-noir hover:bg-gris-pale transition-colors"
              >
                <span>❓</span> Questions fréquentes
              </a>
              <div className="border-t border-gray-100" />
              <a
                href="/contact"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-noir hover:bg-gris-pale transition-colors"
              >
                <span>✉️</span> Contactez-nous
              </a>
            </div>
          </>
        )}

        {/* Bouton principal */}
        <button
          onClick={() => setShowHelpMenu(v => !v)}
          className="bg-rouge text-white rounded-full shadow-lg px-4 py-3 text-sm font-semibold flex items-center gap-2 hover:bg-rouge/90 transition-colors"
          aria-label="Besoin d'aide ?"
        >
          <span>💬</span>
          <span className="hidden sm:inline">Besoin d&apos;aide ?</span>
        </button>
      </div>
    </div>
  )
}
