import { NextRequest, NextResponse } from 'next/server'
import { setGalleryMetadata, setPublished } from '@/lib/r2'

function authManager(req: NextRequest) {
  return req.headers.get('x-manager-password') === process.env.MANAGER_PASSWORD
}

interface GalleryRef {
  location: string
  date: string
  envol: string
}

export async function POST(req: NextRequest) {
  if (!authManager(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { galleries }: { galleries: GalleryRef[] } = await req.json()
  if (!galleries?.length) {
    return NextResponse.json({ error: 'Liste vide.' }, { status: 400 })
  }

  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await Promise.all(
      galleries.flatMap(({ location, date, envol }) => [
        setGalleryMetadata(location, date, envol, {
          status: 'active',
          location,
          date,
          envol,
          activatedAt: now.toISOString(),
          expiresAt,
        }),
        setPublished(location, date, envol, true),
      ])
    )

    return NextResponse.json({ success: true, count: galleries.length, expiresAt })
  } catch (err) {
    console.error('Erreur approbation bulk:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
