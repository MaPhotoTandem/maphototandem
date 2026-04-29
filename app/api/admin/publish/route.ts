import { NextRequest, NextResponse } from 'next/server'
import { setPublished } from '@/lib/r2'

function authManager(req: NextRequest) {
  return req.headers.get('x-manager-password') === process.env.MANAGER_PASSWORD
}

// POST — approuve ou retire l'approbation d'une envolée
export async function POST(req: NextRequest) {
  if (!authManager(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const body = await req.json()
  const { location, date, envol, published } = body as {
    location: string
    date: string
    envol: string
    published: boolean
  }

  if (!location || !date || !envol || typeof published !== 'boolean') {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  try {
    await setPublished(location, date, envol, published)
    return NextResponse.json({ success: true, published })
  } catch (err) {
    console.error('Erreur setPublished:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
