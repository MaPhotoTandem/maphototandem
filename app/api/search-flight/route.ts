import { NextRequest, NextResponse } from 'next/server'
import { listFlights, getGalleryMetadata } from '@/lib/r2'

// Normalise un prénom pour la comparaison (minuscules, sans accents)
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// GET — recherche une envolée par date + location + début du prénom
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const location = searchParams.get('location')
  const date = searchParams.get('date')
  const firstName = searchParams.get('firstName')

  if (!location || !date || !firstName) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  const normalizedFirst = normalize(firstName)
  if (normalizedFirst.length < 2) {
    return NextResponse.json({ error: 'Prénom trop court.' }, { status: 400 })
  }

  try {
    // Lister toutes les envolées publiées pour ce jour + cette succursale
    const flights = await listFlights(location, date)
    const publishedFlights = flights.filter((f) => f.published)

    // Pour chaque envolée publiée, vérifier si un passager correspond
    const matches: { envol: string }[] = []

    await Promise.all(
      publishedFlights.map(async (flight) => {
        const meta = await getGalleryMetadata(location, date, flight.envol)
        if (!meta?.passengers || meta.passengers.length === 0) return

        const hasMatch = meta.passengers.some((name) =>
          normalize(name).startsWith(normalizedFirst)
        )

        if (hasMatch) {
          matches.push({ envol: flight.envol })
        }
      })
    )

    // Trier par numéro d'envolée
    matches.sort((a, b) => Number(a.envol) - Number(b.envol))

    return NextResponse.json({ matches })
  } catch (err) {
    console.error('Erreur search-flight:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
