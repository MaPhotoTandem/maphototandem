import { NextRequest, NextResponse } from 'next/server'
import { getGalleryMetadata, setGalleryMetadata, getDownloadToken } from '@/lib/r2'
import { stripe } from '@/lib/stripe'

function authManager(req: NextRequest) {
  return req.headers.get('x-manager-password') === process.env.MANAGER_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!authManager(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { location, date, envol } = await req.json()
  if (!location || !date || !envol) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  try {
    const meta = await getGalleryMetadata(location, date, envol)
    if (!meta) {
      return NextResponse.json({ error: 'Galerie introuvable.' }, { status: 404 })
    }

    // Trouver le token de téléchargement avec l'expiration la plus lointaine
    // pour cette galerie (parmi les ventes Stripe)
    const sessions = await stripe.checkout.sessions.list({ status: 'complete', limit: 100 })
    const relevantSessions = sessions.data.filter(
      (s) => s.metadata?.location === location && s.metadata?.date === date && s.metadata?.envol === envol
    )

    const now = new Date()
    let latestTokenExpiry: Date | null = null

    for (const session of relevantSessions) {
      const token = session.metadata?.downloadToken
      if (!token) continue
      const tokenData = await getDownloadToken(token)
      if (!tokenData) continue
      const exp = new Date(tokenData.expiresAt)
      if (!latestTokenExpiry || exp > latestTokenExpiry) {
        latestTokenExpiry = exp
      }
    }

    // Si token actif trouvé → prolonger jusqu'à son expiration + buffer 24h
    // Sinon → prolonger de 7 jours depuis maintenant
    const newExpiresAt = latestTokenExpiry && latestTokenExpiry > now
      ? new Date(latestTokenExpiry.getTime() + 24 * 60 * 60 * 1000).toISOString()
      : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await setGalleryMetadata(location, date, envol, {
      ...meta,
      status: 'active',
      expiresAt: newExpiresAt,
    })

    return NextResponse.json({ success: true, expiresAt: newExpiresAt })
  } catch (err) {
    console.error('Erreur prolongation galerie:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
