import { NextRequest, NextResponse } from 'next/server'
import { getUploadUrls } from '@/lib/r2'

function authAny(req: NextRequest) {
  const pw = req.headers.get('x-admin-password') || req.headers.get('x-manager-password')
  return pw === process.env.ADMIN_PASSWORD || pw === process.env.MANAGER_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!authAny(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const body = await req.json()
  const { location, date, envol, filename } = body as {
    location: string
    date: string
    envol: string
    filename: string
  }

  const validLocations = ['rive-sud', 'rive-nord']
  if (!location || !validLocations.includes(location)) {
    return NextResponse.json({ error: 'Succursale invalide.' }, { status: 400 })
  }

  if (!date || !envol || !filename) {
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
  }

  if (!/\.(jpg|jpeg|png|webp)$/i.test(filename)) {
    return NextResponse.json(
      { error: 'Format non supporté. Utilisez JPG, PNG ou WebP.' },
      { status: 400 }
    )
  }

  try {
    const result = await getUploadUrls(location, date, envol, filename)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Erreur getUploadUrls:', err)
    return NextResponse.json(
      { error: "Impossible de générer les URLs d'upload." },
      { status: 500 }
    )
  }
}
