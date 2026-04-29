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
    const meta = await getGalleryMetadata(location, date, envol)
    if (!meta) {
      return NextResponse.json({ error: 'Galerie introuvable.' }, { status: 404 })
    }

    await Promise.all([
      setGalleryMetadata(location, date, envol, { ...meta, status: 'expired' }),
      setPublished(location, date, envol, false),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erreur désactivation galerie:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
