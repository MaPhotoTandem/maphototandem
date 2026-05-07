'use client'

import { useState } from 'react'

const FAQ = [
  {
    q: 'Comment retrouver mon envolée ?',
    a: 'Sur la page d\'accueil, clique sur "Retrouver mon envolée" et suis les étapes. Tu auras besoin de la date de ton saut, du centre visité et de ton prénom.',
  },
  {
    q: 'Combien de temps mon lien de téléchargement est-il valide ?',
    a: 'Ton lien est valide 72 heures après l\'achat. Assure-toi de télécharger tes photos avant l\'expiration. Tu peux aussi les partager avec tes proches via ce même lien.',
  },
  {
    q: 'Puis-je acheter les photos de quelqu\'un d\'autre ?',
    a: 'Oui ! Si tu connais la date du saut, le centre et le numéro d\'envolée, tu peux accéder à la galerie et acheter les photos pour offrir en cadeau.',
  },
  {
    q: 'En quelle qualité sont les photos ?',
    a: 'Les photos sont vendues en haute résolution, sans filigrane. Parfaites pour imprimer ou partager sur les réseaux sociaux.',
  },
  {
    q: 'Mon lien est expiré, que faire ?',
    a: 'Contacte-nous via le formulaire ci-dessus en précisant ta date de saut, le centre et ton numéro d\'envolée. On pourra réactiver ton accès.',
  },
]

export default function ContactPage() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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

      {/* Titre */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-3">Nous contacter</h1>
        <p className="text-mid text-base">
          Une question sur tes photos, un lien expiré ou autre chose ? On est là.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-14">

        {/* Formulaire */}
        <div className="md:col-span-3">
          {success ? (
            <div className="bg-pale-blue rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-navy mb-2">Message envoyé !</h2>
              <p className="text-mid text-sm">On te répond dans les plus brefs délais.</p>
              <button
                onClick={() => { setSuccess(false); setName(''); setEmail(''); setSubject(''); setMessage('') }}
                className="mt-6 text-action text-sm underline"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1">Nom *</label>
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
                  <label className="block text-sm font-semibold text-navy mb-1">Courriel *</label>
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
                <label className="block text-sm font-semibold text-navy mb-1">Sujet</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Ex : Lien expiré, question sur ma commande…"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Message *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Décris ta situation (date du saut, centre, numéro d'envolée si applicable)…"
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
          <div className="bg-pale-blue rounded-2xl p-6">
            <h2 className="text-base font-bold text-navy mb-4">Informations</h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-lg">📧</span>
                <div>
                  <p className="font-semibold text-navy">Courriel</p>
                  <a href="mailto:maphototandem@parachutemontreal.com" className="text-action hover:underline break-all">
                    maphototandem@parachutemontreal.com
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg">📍</span>
                <div>
                  <p className="font-semibold text-navy">Rive-Sud</p>
                  <p className="text-mid">Farnham, Québec</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg">📍</span>
                <div>
                  <p className="font-semibold text-navy">Rive-Nord</p>
                  <p className="text-mid">St-Esprit, Québec</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-pale-blue rounded-2xl p-6">
            <h2 className="text-base font-bold text-navy mb-2">Délai de réponse</h2>
            <p className="text-sm text-mid">On répond généralement dans la journée, en saison.</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-2xl font-bold text-navy mb-6">Questions fréquentes</h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-navy text-sm pr-4">{item.q}</span>
                <span className="text-mid text-lg flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-mid leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
