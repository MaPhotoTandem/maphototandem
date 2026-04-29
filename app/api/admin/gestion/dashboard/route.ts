import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { listAllGalleries, getTotalStorageBytes } from '@/lib/r2'

function authManager(req: NextRequest) {
  return req.headers.get('x-manager-password') === process.env.MANAGER_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!authManager(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  try {
    const [sessions, galleries, storageBytes] = await Promise.all([
      stripe.checkout.sessions.list({ status: 'complete', limit: 100 }),
      listAllGalleries(),
      getTotalStorageBytes(),
    ])

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    const salesToday = sessions.data.filter((s) => {
      const d = new Date(s.created * 1000).toISOString().split('T')[0]
      return d === todayStr
    })

    const revenueTodayCents = salesToday.reduce((sum, s) => sum + (s.amount_total ?? 0), 0)
    const revenueTotalCents = sessions.data.reduce((sum, s) => sum + (s.amount_total ?? 0), 0)

    const activeGalleries = galleries.filter((g) => g.status === 'active')

    // Galeries expirant dans les 7 prochains jours
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const expiringSoon = activeGalleries.filter(
      (g) => g.expiresAt && new Date(g.expiresAt) <= in7Days
    )

    return NextResponse.json({
      salesToday: salesToday.length,
      revenueTodayCents,
      salesTotal: sessions.data.length,
      revenueTotalCents,
      activeGalleriesCount: activeGalleries.length,
      expiringSoonCount: expiringSoon.length,
      storageBytes,
    })
  } catch (err) {
    console.error('Erreur dashboard:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
