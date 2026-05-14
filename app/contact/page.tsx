'use client'

import { useState } from 'react'
import HelpBubble from '@/components/HelpBubble'

export default function ContactPage() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    })

    setLoading(false)

    if (res.ok) {
      setSuccess(true)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Une erreur est survenue. Réessaie plus tard.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">

      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-noir mb-3">Nous contacter</h1>
        <p className="text-gris-mid text-base">
          Une question sur tes photos, un lien expiré ou autre chose ? On est là.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

        {/* Formulaire */}
        <div className="md:col-span-3">
          {success ? (
            <div className="bg-gris-pale rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-noir mb-2">Message envoyé !</h2>
              <p className="text-gris-mid text-sm">On te répond dans les plus brefs délais.</p>
              <button
                onClick={() => { setSuccess(false); setName(''); setEmail(''); setSubject(''); setMessage('') }}
                className="mt-6 text-rouge text-sm underline"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-noir mb-1">Nom *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Ton nom"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-noir mb-1">Courriel *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="ton@email.com"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-noir mb-1">Sujet</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Ex : Lien expiré, question sur ma commande…"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-noir mb-1">Message *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Décris ta situation. Pour accélérer notre réponse, inclus ta succursale, la date de ton saut et ton numéro d'envolée."
                  className="input-field resize-none"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Envoi en cours…' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>

        {/* Infos de contact */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-rouge-pale border border-rouge rounded-2xl p-6">
            <h2 className="text-base font-bold text-noir mb-2">Avant d&apos;écrire</h2>
            <p className="text-sm text-gris-mid mb-4">
              Savais-tu qu&apos;il y a des outils pour t&apos;aider ? Visite notre{' '}
              <a href="/faq" className="text-rouge font-semibold hover:underline">FAQ</a>
              {' '}ou notre{' '}
              <a href="/aide/telecharger" className="text-rouge font-semibold hover:underline">guide de téléchargement</a>.
            </p>
          </div>
          <div className="bg-gris-pale rounded-2xl p-6">
            <h2 className="text-base font-bold text-noir mb-4">Informations</h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-lg">📧</span>
                <div>
                  <p className="font-semibold text-noir">Courriel</p>
                  <a href="mailto:maphototandem@parachutemontreal.com" className="text-rouge hover:underline break-all">
                    maphototandem@parachutemontreal.com
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg">📍</span>
                <div>
                  <p className="font-semibold text-noir">Rive-Sud</p>
                  <p className="text-gris-mid">200 chemin Lebeau</p>
                  <p className="text-gris-mid">Farnham, QC J2N 0N5</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg">📍</span>
                <div>
                  <p className="font-semibold text-noir">Rive-Nord</p>
                  <p className="text-gris-mid">29 route 125</p>
                  <p className="text-gris-mid">Saint-Esprit, QC J0K 2L0</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gris-pale rounded-2xl p-6">
            <h2 className="text-base font-bold text-noir mb-2">Délai de réponse</h2>
            <p className="text-sm text-gris-mid">On répond le plus rapidement possible, généralement entre 24h et 48h. En juillet et en août, les délais peuvent être un peu plus longs en raison de la haute saison.</p>
          </div>

        </div>
      </div>

      <HelpBubble />
    </div>
  )
}
