import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Ma Photo Tandem",
  description: "Conditions d'utilisation, politique de remboursement et droits d'usage des photos achetées sur maphototandem.com.",
}

export default function ConditionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
        Conditions d&apos;utilisation
      </h1>
      <p className="text-mid text-sm mb-10">
        Dernière mise à jour : 7 mai 2026 · Ma Photo Tandem — Parachute Montréal
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-navy mb-3">1. Présentation du service</h2>
        <p className="text-gray-700 leading-relaxed">
          Ma Photo Tandem est un service en ligne exploité par Parachute Montréal, permettant aux clients
          d&apos;acheter et de télécharger leurs photos de saut en tandem prises lors de leurs visites dans
          nos centres de Rive-Sud (Farnham) et de Rive-Nord (St-Esprit).
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-navy mb-3">2. Utilisation du service</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          En utilisant maphototandem.com, vous acceptez les présentes conditions dans leur intégralité.
          Le service est réservé aux personnes ayant effectué un saut en tandem chez Parachute Montréal
          ou à leurs proches souhaitant offrir les photos en cadeau.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Vous vous engagez à ne pas utiliser ce service à des fins frauduleuses, illégales ou contraires
          aux présentes conditions.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-navy mb-3">3. Tarification et taxes</h2>
        <p className="text-gray-700 leading-relaxed">
          Le prix des photos est de <strong>49 $ CAD</strong> pour la première photo, et de <strong>10 $ CAD</strong> par
          photo supplémentaire. Les taxes applicables (TPS 5 % et TVQ 9,975 %) sont ajoutées au sous-total
          et affichées clairement avant la confirmation du paiement.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-navy mb-3">4. Livraison et lien de téléchargement</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          Dès que votre paiement est confirmé, un lien de téléchargement personnel vous est envoyé par
          courriel et affiché à l&apos;écran. Ce lien vous permet de télécharger vos photos en JPEG haute
          résolution autant de fois que vous le souhaitez, et de le partager avec vos proches.
        </p>
        <p className="text-gray-700 leading-relaxed">
          <strong>Le lien est valide 72 heures</strong> à compter du moment de votre achat. Passé ce délai,
          le lien expire. Il vous appartient de télécharger vos photos avant l&apos;expiration.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-navy mb-3">5. Politique de remboursement</h2>
        <div className="bg-blue-50 border border-action/20 rounded-lg p-4 mb-4">
          <p className="text-navy font-semibold text-sm">
            Toutes les ventes sont finales. Aucun remboursement, échange ou crédit n&apos;est accordé
            une fois le lien de téléchargement livré.
          </p>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Les photos étant des fichiers numériques livrés instantanément, elles ne sont pas soumises
          au droit de rétractation habituel. Si vous rencontrez un problème technique avec votre commande
          (lien non reçu, erreur de fichier, etc.), contactez-nous à{' '}
          <a href="mailto:maphototandem@parachutemontreal.com" className="text-action hover:underline">
            maphototandem@parachutemontreal.com
          </a>{' '}
          et nous ferons notre possible pour vous aider.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-navy mb-3">6. Droits d&apos;usage des photos</h2>
        <p className="text-gray-700 leading-relaxed mb-3">
          L&apos;achat de vos photos vous confère un droit d&apos;usage personnel et non exclusif. Vous pouvez :
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-3">
          <li>Les imprimer pour usage personnel</li>
          <li>Les partager sur vos réseaux sociaux personnels</li>
          <li>Les offrir à vos proches</li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          Vous ne pouvez pas revendre, sublicencier ou utiliser les photos à des fins commerciales sans
          l&apos;autorisation écrite préalable de Parachute Montréal. Les droits d&apos;auteur sur les photographies
          demeurent la propriété de Parachute Montréal.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-navy mb-3">7. Limitation de responsabilité</h2>
        <p className="text-gray-700 leading-relaxed">
          Parachute Montréal ne pourra être tenu responsable en cas d&apos;interruption du service, de perte
          de données, ou de tout dommage indirect résultant de l&apos;utilisation du site. Notre responsabilité
          est en tout état de cause limitée au montant de votre achat.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-navy mb-3">8. Modifications des conditions</h2>
        <p className="text-gray-700 leading-relaxed">
          Parachute Montréal se réserve le droit de modifier les présentes conditions à tout moment.
          Les conditions en vigueur au moment de votre achat s&apos;appliquent à cette transaction.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-navy mb-3">9. Contact</h2>
        <p className="text-gray-700 leading-relaxed">
          Pour toute question concernant les présentes conditions, contactez-nous à{' '}
          <a href="mailto:maphototandem@parachutemontreal.com" className="text-action hover:underline">
            maphototandem@parachutemontreal.com
          </a>
          .
        </p>
      </section>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <p className="text-mid text-sm">
          <a href="/confidentialite" className="text-action hover:underline">Politique de confidentialité</a>
          {' · '}
          <a href="/faq" className="text-action hover:underline">FAQ</a>
          {' · '}
          <a href="/contact" className="text-action hover:underline">Contact</a>
        </p>
      </div>
    </div>
  )
}
