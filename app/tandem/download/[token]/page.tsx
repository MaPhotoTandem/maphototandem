// Page de téléchargement — publique, accessible à quiconque a le token.
// Le token est généré au moment du checkout et sauvegardé dans R2 par le webhook Stripe.
import { getDownloadToken, getDownloadAndPreviewUrls } from '@/lib/r2'
import DownloadClient from './DownloadClient'
import DownloadPending from './DownloadPending'

const SUCCURSALES: Record<string, string> = {
  'rive-sud':  'Rive-Sud · Farnham',
  'rive-nord': 'Rive-Nord · St-Esprit',
}

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
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-noir mb-2">Ce lien a expiré</h1>
        <p className="text-gris-mid text-sm">
          Le lien de téléchargement était valide 72 heures.<br />
          Pour obtenir de l&apos;aide, contactez-nous.
        </p>
      </div>
    )
  }

  // Token valide — générer des URLs signées fraîches (valides 4 heures)
  const downloads = await getDownloadAndPreviewUrls(tokenData.photoIds)
  const succursaleLabel = SUCCURSALES[tokenData.location] ?? tokenData.location

  return (
    <DownloadClient
      token={token}
      downloads={downloads}
      date={tokenData.date}
      envol={tokenData.envol}
      succursaleLabel={succursaleLabel}
      expiresAt={tokenData.expiresAt}
    />
  )
}
