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
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-noir font-medium">Paiement en cours de confirmation…</p>
          <p className="text-dore text-sm mt-1">Cette page se met à jour automatiquement.</p>
        </div>
      </div>
    )
  }

  const photoIds: string[] = JSON.parse(session.metadata?.photoIds ?? '[]')
  const date  = session.metadata?.date  ?? ''
  const envol = session.metadata?.envol ?? ''
  const downloads = await getDownloadUrls(photoIds)

  return (
    <div className="min-h-[80vh] bg-creme px-4 py-10 sm:py-16">
      <div className="max-w-xl mx-auto">

        {/* Confirmation */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rouge/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-noir mb-2">
            Paiement réussi !
          </h1>
          <p className="text-dore text-sm sm:text-base">
            Envolée {envol} · {date} · {downloads.length} photo{downloads.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Avis courriel */}
        <div className="bg-white border border-dore/20 rounded-2xl p-4 mb-4 flex gap-3">
          <svg className="w-5 h-5 text-dore flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-sm text-noir font-medium">Un courriel vous a été envoyé</p>
            <p className="text-sm text-dore mt-0.5">
              Il contient vos liens de téléchargement.{' '}
              <span className="text-rouge font-medium">Vérifiez vos courriels indésirables</span>{' '}
              si vous ne le trouvez pas dans votre boîte principale.
            </p>
          </div>
        </div>

        {/* Téléchargements */}
        <div className="bg-white border border-dore/20 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-noir text-lg">Télécharger vos photos</h2>
            <span className="text-xs text-dore bg-creme px-2.5 py-1 rounded-full border border-dore/20">
              Valide 72 h
            </span>
          </div>

          <div className="space-y-2">
            {downloads.map((dl, i) => (
              <a
                key={dl.id}
                href={dl.downloadUrl}
                download={dl.filename}
                className="flex items-center justify-between bg-creme hover:bg-rouge/5 active:bg-rouge/10 border border-dore/20 rounded-xl px-4 py-3 min-h-[52px] transition-colors group"
              >
                <span className="text-sm text-noir truncate flex-1 mr-2">
                  Photo {i + 1}
                </span>
                <span className="text-rouge text-sm font-semibold flex items-center gap-1.5 flex-shrink-0 group-hover:gap-2 transition-all">
                  Télécharger
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-dore mt-8">
          Merci d&apos;avoir sauté avec Parachute Montréal !
        </p>

      </div>
    </div>
  )
}
