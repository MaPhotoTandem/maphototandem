import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Ma Photo Tandem',
  description: 'Comment Ma Photo Tandem — Parachute Montréal collecte, utilise et protège vos informations personnelles, conformément à la Loi 25 du Québec.',
}

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold text-noir mb-2">
        Politique de confidentialité
      </h1>
      <p className="text-gris-mid text-sm mb-10">
        Dernière mise à jour : 7 mai 2026 · Ma Photo Tandem — Parachute Montréal
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-noir mb-3">1. Qui sommes-nous</h2>
        <p className="text-gray-700 leading-relaxed">
          Ma Photo Tandem est un service exploité par Parachute Montréal, dont les centres sont situés
          à Farnham (Rive-Sud) et Saint-Esprit (Rive-Nord), Québec, Canada. La présente politique
          explique comment nous collectons, utilisons et protégeons vos informations personnelles,
          conformément à la <em>Loi sur la protection des renseignements personnels dans le secteur privé</em>{' '}
          (Loi 25) du Québec.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-noir mb-3">2. Informations collectées</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Lors d&apos;un achat sur maphototandem.com, nous collectons uniquement les informations nécessaires
          au traitement de votre commande :
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Votre adresse courriel (pour l&apos;envoi du lien de téléchargement)</li>
          <li>Les informations de paiement (traitées directement par Stripe — nous n&apos;y avons pas accès)</li>
          <li>Les métadonnées de commande : date de saut, numéro d&apos;envolée, succursale, photos sélectionnées</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-noir mb-3">3. Utilisation des informations</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Vos informations sont utilisées exclusivement pour :
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Traiter votre paiement via Stripe</li>
          <li>Vous envoyer votre lien de téléchargement par courriel</li>
          <li>Assurer le support client en cas de problème avec votre commande</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-3">
          Nous n&apos;utilisons pas vos informations à des fins de marketing sans votre consentement explicite.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-noir mb-3">4. Partage des informations</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Vos informations ne sont jamais vendues. Elles peuvent être transmises aux tiers suivants,
          uniquement dans la mesure nécessaire au fonctionnement du service :
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>
            <strong>Stripe</strong> — traitement des paiements.{' '}
            <a href="https://stripe.com/en-ca/privacy" target="_blank" rel="noopener noreferrer" className="text-rouge hover:underline">
              Politique de confidentialité Stripe
            </a>
          </li>
          <li>
            <strong>Resend</strong> — envoi des courriels transactionnels
          </li>
          <li>
            <strong>Cloudflare R2</strong> — stockage sécurisé des photos et tokens de téléchargement
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-noir mb-3">5. Conservation des données</h2>
        <p className="text-gray-700 leading-relaxed">
          Les tokens de téléchargement et métadonnées de commande sont conservés pendant 72 heures
          suivant votre achat, puis supprimés automatiquement. Votre adresse courriel peut être conservée
          dans nos journaux d&apos;activité pendant une durée maximale de 12 mois à des fins de support.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-noir mb-3">6. Sécurité</h2>
        <p className="text-gray-700 leading-relaxed">
          Toutes les communications entre votre navigateur et notre site sont chiffrées via HTTPS.
          Les paiements sont traités exclusivement par Stripe, certifié PCI DSS. Nous ne stockons
          jamais vos informations de carte bancaire.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-noir mb-3">7. Vos droits (Loi 25)</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Conformément à la Loi 25, vous avez le droit de :
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Accéder aux informations personnelles que nous détenons sur vous</li>
          <li>Demander la rectification d&apos;informations inexactes</li>
          <li>Demander la suppression de vos informations personnelles</li>
          <li>Se désabonner de toute communication marketing, si applicable</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-3">
          Pour exercer ces droits, contactez-nous à{' '}
          <a href="mailto:maphototandem@parachutemontreal.com" className="text-rouge hover:underline">
            maphototandem@parachutemontreal.com
          </a>
          .
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-noir mb-3">8. Témoins (cookies)</h2>
        <p className="text-gray-700 leading-relaxed">
          maphototandem.com n&apos;utilise pas de témoins (cookies) de suivi ou publicitaires. Des cookies
          techniques strictement nécessaires au fonctionnement du site peuvent être utilisés, sans
          collecte de données personnelles.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-noir mb-3">9. Contact</h2>
        <p className="text-gray-700 leading-relaxed">
          Pour toute question relative à la protection de vos données personnelles, contactez-nous à{' '}
          <a href="mailto:maphototandem@parachutemontreal.com" className="text-rouge hover:underline">
            maphototandem@parachutemontreal.com
          </a>
          .
        </p>
      </section>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <p className="text-gris-mid text-sm">
          <a href="/conditions" className="text-rouge hover:underline">Conditions d&apos;utilisation</a>
          {' · '}
          <a href="/faq" className="text-rouge hover:underline">FAQ</a>
          {' · '}
          <a href="/contact" className="text-rouge hover:underline">Contact</a>
        </p>
      </div>
    </div>
  )
}
