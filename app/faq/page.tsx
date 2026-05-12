'use client'

import React, { useState } from 'react'
import HelpBubble from '@/components/HelpBubble'

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Comment vais-je recevoir mes photos ?',
    a: 'Après ton achat, tu es automatiquement redirigé vers ton lien de téléchargement. Ce lien t\'est également envoyé par courriel afin de pouvoir y accéder à tout moment pendant les 72 heures suivant ton achat.',
  },
  {
    q: 'Y a-t-il une limite de téléchargement ?',
    a: 'Non, tu peux télécharger les photos autant de fois que tu le veux pendant les 72 heures que ton lien est actif. Tu peux donc envoyer le lien à mami, papi et tous tes amis !',
  },
  {
    q: 'Je ne connais pas mon numéro d\'envolée. Que faire ?',
    a: 'Sur la page d\'accueil, clique sur "J\'ai perdu mon numéro d\'envolée" et suis les étapes. Tu auras besoin de la date de ton saut, du centre visité et de ton prénom.',
  },
  {
    q: 'Mon prénom ne donne aucun résultat quand je recherche mon envolée. Que faire ?',
    a: <>Après avoir vérifié la date et la succursale, essaie de rechercher avec ton nom de famille. Il arrive que les deux aient été intervertis lors de l&apos;enregistrement. Si ça ne fonctionne pas, tente les variantes orthographiques courantes de ton prénom ; malgré notre vigilance, une erreur peut parfois se glisser. Si tu n&apos;arrives toujours pas à retrouver ton envolée, contacte-nous via la page <a href="/contact" className="text-rouge hover:underline">Contact</a> ou par courriel à maphototandem@parachutemontreal.com.</>,
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
    a: 'Les photos te sont remises en JPEG haute résolution (entre 8 Mo et 15 Mo chacune), idéales pour l\'impression ou le partage sur les réseaux sociaux. Les fichiers RAW ne sont pas disponibles.',
  },
  {
    q: 'Mes photos contiendront-elles un filigrane après l\'achat ?',
    a: 'Non. Les filigranes visibles sur les photos en galerie servent uniquement à protéger notre travail avant l\'achat. Une fois achetées, tes photos te sont transmises en pleine qualité, sans aucun filigrane.',
  },
  {
    q: 'Puis-je imprimer les photos après les avoir reçues ?',
    a: 'Absolument ! Le format JPEG haute résolution que tu reçois est parfaitement adapté à l\'impression. Nous ne fournissons pas de système d\'impression sur notre site.',
  },
  {
    q: 'Puis-je obtenir un remboursement ?',
    a: 'Non. Toutes les ventes sont finales. Dès que le lien de téléchargement t\'est envoyé, aucun échange, crédit ou remboursement n\'est possible. Si tu as un problème avec ta commande, contacte-nous via la page Contact et on fera notre possible pour t\'aider.',
  },
  {
    q: 'Mon lien est expiré et je n\'ai pas téléchargé mes photos. Que faire ?',
    a: 'Contacte-nous via le formulaire de contact ou par courriel à maphototandem@parachutemontreal.com en précisant ta date de saut, le centre et ton numéro d\'envolée. Bien que nous ne puissions pas garantir la disponibilité des photos après l\'expiration du lien, nous ferons tout notre possible pour réactiver ton accès.',
  },
  {
    q: 'Je ne vois pas ma vidéo de sortie d\'avion GoPro. Pourquoi ?',
    a: 'C\'est tout à fait normal. La vidéo GoPro n\'est disponible que sur place, le jour de ton saut. Elle n\'est pas accessible via notre site, qui ne supporte pas la vidéo pour l\'instant.',
  },
  {
    q: 'Pourquoi ne puis-je pas acheter le même forfait qui m\'a été proposé sur place ?',
    a: 'Les forfaits sur place ne sont pas disponibles en ligne pour des raisons de structure. D\'une part, la gestion individuelle des fichiers pour chaque sauteur est complexe à gérer à distance. D\'autre part, les rabais de groupe compliquent la structure de prix en ligne. Pour compenser, nous avons mis en place un tarif dégressif : la première photo est à 49 $ + tx, et chaque photo supplémentaire n\'est qu\'à 10 $ + tx.',
  },
  {
    q: 'La photo à l\'unité est plus chère sur votre site que sur place. Pourquoi ?',
    a: 'La vente en ligne engendre des frais supplémentaires (plateforme, traitement des paiements, hébergement) qui se reflètent dans le prix unitaire. Pour équilibrer le tout, nous avons instauré un tarif dégressif : à partir de la deuxième photo, chaque photo supplémentaire n\'est qu\'à 10 $ + tx au lieu de 49 $ + tx.',
  },
]

export default function FaqPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">

      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-noir mb-3">Questions fréquentes</h1>
        <p className="text-gris-mid text-base">
          Tu ne trouves pas ta réponse ?{' '}
          <a href="/contact" className="text-rouge hover:underline">Contacte-nous</a>.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-noir text-sm pr-4">{item.q}</span>
              <span className="text-gris-mid text-lg flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
            </button>
            {openFaq === i && (
              <div className="px-5 pb-4 text-sm text-gris-mid leading-relaxed">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <HelpBubble />
    </div>
  )
}
