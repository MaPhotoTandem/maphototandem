import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getDownloadToken, getGalleryMetadata } from '@/lib/r2'

function authManager(req: NextRequest) {
  return req.headers.get('x-manager-password') === process.env.MANAGER_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!authManager(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  try {
    const sessions = await stripe.checkout.sessions.list({
      status: 'complete',
      limit: 100,
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const now = new Date()

    // Récupérer le statut de chaque galerie unique (1 appel R2 par galerie, pas par vente)
    const uniqueGalleries = new Set(
      sessions.data.map((s) => {
        const m = s.metadata ?? {}
        return `${m.location ?? ''}/${m.date ?? ''}/${m.envol ?? ''}`
      })
    )
    const galleryStatuses = new Map<string, string>()
    await Promise.all(
      Array.from(uniqueGalleries).map(async (key) => {
        const [location, date, envol] = key.split('/')
        if (!location || !date || !envol) return
        const meta = await getGalleryMetadata(location, date, envol)
        if (meta) galleryStatuses.set(key, meta.status)
      })
    )

    const sales = await Promise.all(
      sessions.data.map(async (session) => {
        const metadata = session.metadata ?? {}
        const downloadToken = metadata.downloadToken ?? ''

        let isActive = false
        let expiresAt = ''

        if (downloadToken) {
          const tokenData = await getDownloadToken(downloadToken)
          if (tokenData) {
            expiresAt = tokenData.expiresAt
            isActive = new Date(tokenData.expiresAt) > now
          }
        }

        const galleryKey = `${metadata.location ?? ''}/${metadata.date ?? ''}/${metadata.envol ?? ''}`
        const galleryArchived = galleryStatuses.get(galleryKey) === 'archived'

        return {
          sessionId: session.id,
          downloadToken,
          customerName: session.customer_details?.name ?? null,
          customerEmail: session.customer_details?.email ?? null,
          location: metadata.location ?? '',
          date: metadata.date ?? '',
          envol: metadata.envol ?? '',
          amount: session.amount_total ?? 0,
          createdAt: new Date(session.created * 1000).toISOString(),
          isActive,
          expiresAt,
          downloadUrl: downloadToken ? `${baseUrl}/tandem/download/${downloadToken}` : '',
          galleryArchived,
        }
      })
    )

    sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ sales })
  } catch (err) {
    console.error('Erreur ventes:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
