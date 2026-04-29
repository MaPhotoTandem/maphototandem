'use client'
// Affiché si le token n'est pas encore dans R2 (webhook Stripe en transit).
// Fait du polling toutes les 2 secondes pendant max 60 secondes.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DownloadPending({ token }: { token: string }) {
  const router = useRouter()
  const [seconds, setSeconds] = useState(0)
  const MAX_WAIT = 60

  useEffect(() => {
    if (seconds >= MAX_WAIT) return

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/token-ready/${token}`)
        const { ready } = await res.json()
        if (ready) {
          router.refresh()
        } else {
          setSeconds((s) => s + 2)
        }
      } catch {
        setSeconds((s) => s + 2)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [seconds, token, router])

  if (seconds >= MAX_WAIT) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-navy mb-2">La confirmation prend plus de temps que prévu</h1>
        <p className="text-mid text-sm mb-6">
          Votre paiement est traité par Stripe. Vous recevrez un courriel avec votre lien dès que c&apos;est confirmé.
        </p>
        <button
          onClick={() => { setSeconds(0); router.refresh() }}
          className="bg-action text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-navy mb-2">Paiement confirmé !</h1>
      <p className="text-mid text-sm mb-6">Préparation de vos photos en cours...</p>

      {/* Spinner */}
      <div className="flex justify-center">
        <svg className="animate-spin w-6 h-6 text-action" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    </div>
  )
}
