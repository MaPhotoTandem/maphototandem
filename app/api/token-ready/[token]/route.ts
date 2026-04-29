// Vérifie si un token de téléchargement est prêt dans R2.
// Utilisé par la page /download/[token] pour poller après le paiement
// (le webhook Stripe peut prendre quelques secondes à déclencher).
import { NextRequest, NextResponse } from 'next/server'
import { getDownloadToken } from '@/lib/r2'

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = await getDownloadToken(params.token)
  return NextResponse.json({ ready: token !== null })
}
