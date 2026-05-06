import { NextRequest, NextResponse } from 'next/server'
import { getGalleryMetadata, setGalleryMetadata } from '@/lib/r2'

function authAny(req: NextRequest) {
  const pw = req.headers.get('x-admin-password') || req.headers.get('x-manager-password')
  return pw === process.env.ADMIN_PASSWORD || pw === process.env.MANAGER_PASSWORD
}

// PUT — sauvegarde les prénoms des sauteurs d'une envolée
export async function PUT(req: NextRequest) {
  if (!authAny(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const body = await req.json()
  const { location, date, envol, passengers } = body as {
    location: string
    date: string
    envol: string
    passengers: string[]
  }

  if (!location || !date || !envol || !Array.isArray(passengers)) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  try {
    const existing = await getGalleryMetadata(location, date, envol)

    await setGalleryMetadata(location, date, envol, {
      status: 'pending',
      ...existing,
      location,
      date,
      envol,
      passengers,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erreur sauvegarde prénoms:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// GET — récupère les prénoms d'une envolée
export async function GET(req: NextRequest) {
  if (!authAny(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const location = searchParams.get('location')
  const date = searchParams.get('date')
  const envol = searchParams.get('envol')

  if (!location || !date || !envol) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  try {
    const meta = await getGalleryMetadata(location, date, envol)
    return NextResponse.json({ passengers: meta?.passengers ?? [] })
  } catch (err) {
    console.error('Erreur lecture prénoms:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
