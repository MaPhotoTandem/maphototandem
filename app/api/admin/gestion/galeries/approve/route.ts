import { NextRequest, NextResponse } from 'next/server'
import { getGalleryMetadata, setGalleryMetadata, setPublished } from '@/lib/r2'

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
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const meta = await getGalleryMetadata(location, date, envol)

    await Promise.all([
      // Créer / mettre à jour .gallery.json
      setGalleryMetadata(location, date, envol, {
        status: 'active',
        location,
        date,
        envol,
        activatedAt: meta?.activatedAt ?? now.toISOString(),
        expiresAt,
      }),
      // Maintenir la compatibilité avec le système .published existant
      setPublished(location, date, envol, true),
    ])

    return NextResponse.json({ success: true, expiresAt })
  } catch (err) {
    console.error('Erreur approbation galerie:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
