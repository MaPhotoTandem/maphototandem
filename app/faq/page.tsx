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
    a: 'Contacte-nous via le formulaire de contact en précisant ta date de saut, le centre et ton numéro d\'envolée. On pourra réactiver ton accès.',
  },
]

export default function FaqPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">

      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-3">Questions fréquentes</h1>
        <p className="text-mid text-base">
          Tu ne trouves pas ta réponse ?{' '}
          <a href="/contact" className="text-action hover:underline">Contacte-nous</a>.
        </p>
      </div>

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
  )
}
