// Réactiver un lien expiré — crée un nouveau token UUID + envoie le courriel
import { NextRequest, NextResponse } from 'next/server'
import { getDownloadToken, saveDownloadToken } from '@/lib/r2'
import { randomUUID } from 'crypto'
import { SUCCURSALES, formatExpiresAt, buildEmailHtml, sendDownloadEmail } from '@/lib/email'

function authManager(req: NextRequest) {
  return req.headers.get('x-manager-password') === process.env.MANAGER_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!authManager(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { downloadToken } = await req.json()
  if (!downloadToken) {
    return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
  }

  try {
    const tokenData = await getDownloadToken(downloadToken)
    if (!tokenData) {
      return NextResponse.json({ error: 'Token introuvable.' }, { status: 404 })
    }

    // Nouveau token UUID + expiration +72h
    const newToken = randomUUID()
    const newExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

    await saveDownloadToken(newToken, {
      ...tokenData,
      createdAt: new Date().toISOString(),
      expiresAt: newExpiresAt,
    })

    // Envoyer le courriel si email disponible
    const email = tokenData.email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const downloadUrl = `${baseUrl}/tandem/download/${newToken}`

    if (email) {
      const succursaleLabel = SUCCURSALES[tokenData.location] ?? tokenData.location ?? ''
      const photoCount = tokenData.photoIds?.length ?? 0
      const amountFormatted = (tokenData.amount / 100).toFixed(2)
      const expiresFormatted = formatExpiresAt(newExpiresAt)

      const html = buildEmailHtml({
        downloadUrl,
        photoCount,
        date: tokenData.date,
        envol: tokenData.envol,
        succursaleLabel,
        amountFormatted,
        expiresFormatted,
        titre: 'Votre nouveau lien est prêt 🪂',
      })

      const sent = await sendDownloadEmail({
        to: email,
        subject: 'Votre nouveau lien de téléchargement 🪂 📷 - Ma Photo Tandem',
        html,
      })

      if (!sent) {
        console.error('[reactivate] Erreur envoi courriel')
      }
    }

    return NextResponse.json({
      success: true,
      newToken,
      downloadUrl,
      expiresAt: newExpiresAt,
      emailSent: !!email,
    })
  } catch (err) {
    console.error('[reactivate] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
