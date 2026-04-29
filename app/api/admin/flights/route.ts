import { NextRequest, NextResponse } from 'next/server'
import { listFlights } from '@/lib/r2'

function authAny(req: NextRequest) {
  const pw = req.headers.get('x-admin-password') || req.headers.get('x-manager-password')
  return pw === process.env.ADMIN_PASSWORD || pw === process.env.MANAGER_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!authAny(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const location = searchParams.get('location')
  const date = searchParams.get('date')

  const validLocations = ['rive-sud', 'rive-nord']
  if (!location || !validLocations.includes(location) || !date) {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })
  }

  try {
    const flights = await listFlights(location, date)
    return NextResponse.json({ flights })
  } catch (err) {
    console.error('Erreur listFlights:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
