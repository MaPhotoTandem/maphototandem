import { stripe } from '@/lib/stripe'
import { getDownloadUrls } from '@/lib/r2'
import { notFound } from 'next/navigation'

interface Props {
  searchParams: { session_id?: string }
}

export default async function SuccessPage({ searchParams }: Props) {
  const sessionId = searchParams.session_id
  if (!sessionId) notFound()

  let session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    notFound()
  }

  if (session.payment_status !== 'paid') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-yellow-600">Paiement en attente de confirmation...</p>
      </div>
    )
  }

  const photoIds: string[] = JSON.parse(session.metadata?.photoIds ?? '[]')
  const date  = session.metadata?.date  ?? ''
  const envol = session.metadata?.envol ?? ''
  const downloads = await getDownloadUrls(photoIds)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">

      {/* Confirmation */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-navy">Paiement réussi !</h1>
        <p className="text-mid text-sm sm:text-base">
          Envolée {envol} du {date} · {downloads.length} photo{downloads.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Téléchargements */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-semibold mb-2 text-navy text-lg">Télécharger vos photos</h2>
        <p className="text-sm text-mid mb-5">
          Les liens sont valides pendant <strong>24 heures</strong>. Sauvegardez vos photos maintenant.
        </p>

        <div className="space-y-2">
          {downloads.map((dl, i) => (
            <a
              key={dl.id}
              href={dl.downloadUrl}
              download={dl.filename}
              /* min-h-[52px] pour une cible de tap confortable sur mobile */
              className="flex items-center justify-between bg-gray-50 hover:bg-pale-blue active:bg-pale-blue border border-gray-200 rounded-xl px-4 py-3 min-h-[52px] transition-colors"
            >
              <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                Photo {i + 1}
              </span>
              <span className="text-action text-sm font-semibold flex items-center gap-1 flex-shrink-0">
                Télécharger
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-mid mt-8">
        Merci d&apos;avoir sauté avec Parachute Montréal ! 🪂
      </p>
    </div>
  )
}
