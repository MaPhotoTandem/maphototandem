import { NextRequest, NextResponse } from 'next/server'
import { listPhotos, deletePhoto } from '@/lib/r2'

function authAny(req: NextRequest) {
  const pw = req.headers.get('x-admin-password') || req.headers.get('x-manager-password')
  return pw === process.env.ADMIN_PASSWORD || pw === process.env.MANAGER_PASSWORD
}

// GET — liste les photos d'une envolée
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
    const photos = await listPhotos(location, date, envol)
    return NextResponse.json({ photos })
  } catch (err) {
    console.error('Erreur listPhotos:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// DELETE — supprime une photo (web + original)
export async function DELETE(req: NextRequest) {
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

  if (!location || !date || !envol || !filename) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  try {
    await deletePhoto(location, date, envol, filename)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erreur deletePhoto:', err)
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
  }
}
