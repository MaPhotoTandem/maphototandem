import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getGalleryMetadata, setGalleryMetadata, getDownloadToken, purgeGalleryKeepPurchased } from '@/lib/r2'

function authManager(req: NextRequest) {
  return req.headers.get('x-manager-password') === process.env.MANAGER_PASSWORD
}

export async function DELETE(req: NextRequest) {
  if (!authManager(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { location, date, envol } = await req.json()
  if (!location || !date || !envol) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  try {
    const meta = await getGalleryMetadata(location, date, envol)

    // Trouver toutes les ventes pour cette galerie via Stripe
    const sessions = await stripe.checkout.sessions.list({ status: 'complete', limit: 100 })
    const gallerySessions = sessions.data.filter(
      (s) =>
        s.metadata?.location === location &&
        s.metadata?.date === date &&
        s.metadata?.envol === envol
    )

    // Collecter les clés web des photos achetées (à conserver)
    const purchasedWebKeys = new Set<string>()
    await Promise.all(
      gallerySessions.map(async (session) => {
        const downloadToken = session.metadata?.downloadToken
        if (!downloadToken) return
        const tokenData = await getDownloadToken(downloadToken)
        if (!tokenData) return
        for (const originalKey of tokenData.photoIds) {
          const webKey = originalKey.replace('/originals/', '/web/')
          purchasedWebKeys.add(webKey)
        }
      })
    )

    // Purger la galerie en gardant seulement les web des photos achetées
    await purgeGalleryKeepPurchased(location, date, envol, purchasedWebKeys)

    // Marquer comme archived dans .gallery.json
    await setGalleryMetadata(location, date, envol, {
      ...(meta ?? { location, date, envol }),
      status: 'archived',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erreur suppression galerie R2:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
