// Page de téléchargement — publique, accessible à quiconque a le token.
// Le token est généré au moment du checkout et sauvegardé dans R2 par le webhook Stripe.
import { getDownloadToken } from '@/lib/r2'
import { SUCCURSALES } from '@/lib/email'
import DownloadClient from './DownloadClient'
import DownloadPending from './DownloadPending'

interface Props {
  params: { token: string }
}

export default async function DownloadPage({ params }: Props) {
  const { token } = params
  const tokenData = await getDownloadToken(token)

  // Token inexistant — le webhook n'a pas encore déclenché (quelques secondes de délai normal)
  if (!tokenData) {
    return <DownloadPending token={token} />
  }

  // Token expiré
  const now = new Date()
  const expiresAt = new Date(tokenData.expiresAt)
  if (now > expiresAt) {
    return (
      <div className="min-h-screen bg-gris-pale flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gris-bordure p-10 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-gris-pale rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gris-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-noir mb-2">Ce lien a expiré</h1>
          <p className="text-gris-mid text-sm leading-relaxed">
            Le lien de téléchargement était valide 72 heures.<br />
            Pour obtenir de l&apos;aide, contactez-nous.
          </p>
        </div>
      </div>
    )
  }

  const succursaleLabel = SUCCURSALES[tokenData.location] ?? tokenData.location

  return (
    <DownloadClient
      token={token}
      photoCount={tokenData.photoIds.length}
      date={tokenData.date}
      envol={tokenData.envol}
      succursaleLabel={succursaleLabel}
      expiresAt={tokenData.expiresAt}
    />
  )
}
