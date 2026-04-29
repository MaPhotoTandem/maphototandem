import { NextRequest, NextResponse } from 'next/server'
import { listPhotos } from '@/lib/r2'

export async function GET(
  _req: NextRequest,
  { params }: { params: { location: string; date: string; envol: string } }
) {
  const { location, date, envol } = params

  const validLocations = ['rive-sud', 'rive-nord']
  if (!validLocations.includes(location)) {
    return NextResponse.json({ error: 'Succursale invalide.' }, { status: 400 })
  }

  if (!date.match(/^\d{4}-\d{2}-\d{2}$/) || !envol.match(/^\d+$/)) {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })
  }

  try {
    const photos = await listPhotos(location, date, envol)
    return NextResponse.json({ photos })
  } catch (err) {
    console.error('Erreur listPhotos:', err)
    return NextResponse.json(
      { error: 'Impossible de charger les photos. Réessayez plus tard.' },
      { status: 500 }
    )
  }
}
