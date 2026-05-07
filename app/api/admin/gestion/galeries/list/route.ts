import { NextRequest, NextResponse } from 'next/server'
import { listAllGalleries, getTotalStorageBytes } from '@/lib/r2'
import { stripe } from '@/lib/stripe'

function authManager(req: NextRequest) {
  return req.headers.get('x-manager-password') === process.env.MANAGER_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!authManager(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  try {
    const [galleries, sessions, totalStorageBytes] = await Promise.all([
      listAllGalleries(),
      stripe.checkout.sessions.list({ status: 'complete', limit: 100 }),
      getTotalStorageBytes(),
    ])

    // Compter les ventes par galerie (location + date + envol)
    const salesCount: Record<string, number> = {}
    for (const session of sessions.data) {
      const m = session.metadata ?? {}
      if (m.location && m.date && m.envol) {
        const key = `${m.location}/${m.date}/${m.envol}`
        salesCount[key] = (salesCount[key] ?? 0) + 1
      }
    }

    // Enrichir chaque galerie avec le nombre de ventes
    const enriched = galleries.map((g) => ({
      ...g,
      salesCount: salesCount[`${g.location}/${g.date}/${g.envol}`] ?? 0,
    }))

    return NextResponse.json({ galleries: enriched, totalStorageBytes })
  } catch (err) {
    console.error('Erreur liste galeries:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
