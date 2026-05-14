// Renvoyer le courriel de téléchargement à un client existant
import { NextRequest, NextResponse } from 'next/server'
import { getDownloadToken } from '@/lib/r2'
import { SUCCURSALES, formatExpiresAt, buildEmailHtml, sendDownloadEmail } from '@/lib/email'

function authManager(req: NextRequest) {
  return req.headers.get('x-manager-password') === process.env.MANAGER_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!authManager(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { downloadToken, customerEmail } = await req.json()
  if (!downloadToken) {
    return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
  }

  try {
    const tokenData = await getDownloadToken(downloadToken)
    if (!tokenData) {
      return NextResponse.json({ error: 'Token introuvable.' }, { status: 404 })
    }

    const email = customerEmail ?? tokenData.email
    if (!email) {
      return NextResponse.json({ error: 'Aucun courriel associé à cette vente.' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const downloadUrl = `${baseUrl}/tandem/download/${downloadToken}`
    const succursaleLabel = SUCCURSALES[tokenData.location] ?? tokenData.location ?? ''
    const photoCount = tokenData.photoIds?.length ?? 0
    const amountFormatted = (tokenData.amount / 100).toFixed(2)
    const expiresFormatted = formatExpiresAt(tokenData.expiresAt)

    const html = buildEmailHtml({
      downloadUrl,
      photoCount,
      date: tokenData.date,
      envol: tokenData.envol,
      succursaleLabel,
      amountFormatted,
      expiresFormatted,
    })

    const sent = await sendDownloadEmail({
      to: email,
      subject: 'Vos photos sont prêtes ! 🪂 📷 - Ma Photo Tandem',
      html,
    })

    if (!sent) {
      return NextResponse.json({ error: 'Erreur envoi courriel.' }, { status: 500 })
    }

    console.log(`📧 Courriel renvoyé à: ${email} (token: ${downloadToken})`)
    return NextResponse.json({ success: true, sentTo: email })
  } catch (err) {
    console.error('Erreur resend-email:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
