// Webhook Stripe — appelé automatiquement par Stripe après chaque paiement réussi
// Sur checkout.session.completed :
//   1. Sauvegarde un token de téléchargement dans R2 (tokens/{token}.json)
//   2. Envoie un courriel au client via Resend avec le lien de téléchargement
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { saveDownloadToken } from '@/lib/r2'
import { SUCCURSALES, formatExpiresAt, buildEmailHtml, sendDownloadEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const {
      photoIds: photoIdsJson,
      location,
      date,
      envol,
      downloadToken,
    } = session.metadata ?? {}

    if (!downloadToken || !photoIdsJson) {
      console.error('Webhook: metadata manquante', session.metadata)
      return NextResponse.json({ received: true })
    }

    const photoIds: string[] = JSON.parse(photoIdsJson)
    const email = session.customer_details?.email ?? null
    const amount = session.amount_total ?? 0

    const now = new Date()
    // Lien valide 72 heures
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString()

    // 1. Sauvegarder le token dans R2
    try {
      await saveDownloadToken(downloadToken, {
        photoIds,
        email,
        location: location ?? '',
        date: date ?? '',
        envol: envol ?? '',
        amount,
        createdAt: now.toISOString(),
        expiresAt,
      })
      console.log(`✅ Token sauvegardé: ${downloadToken}`)
    } catch (err) {
      console.error('Erreur sauvegarde token R2:', err)
      // On continue même si R2 échoue — on ne veut pas bloquer Stripe
    }

    // 2. Envoyer le courriel via Resend
    if (email) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
        const downloadUrl = `${baseUrl}/tandem/download/${downloadToken}`
        const succursaleLabel = SUCCURSALES[location ?? ''] ?? location ?? ''
        const photoCount = photoIds.length
        const amountFormatted = (amount / 100).toFixed(2)
        const expiresFormatted = formatExpiresAt(expiresAt)

        const html = buildEmailHtml({
          downloadUrl,
          photoCount,
          date: date ?? '',
          envol: envol ?? '',
          succursaleLabel,
          amountFormatted,
          expiresFormatted,
        })

        const sent = await sendDownloadEmail({
          to: email,
          subject: 'Vos photos sont prêtes ! 🪂 📷 - Ma Photo Tandem',
          html,
        })

        if (sent) {
          console.log(`📧 Courriel envoyé à: ${email}`)
        }
      } catch (err) {
        console.error('Erreur envoi courriel:', err)
        // Ne pas bloquer Stripe si l'email échoue
      }
    } else {
      console.warn('Webhook: pas de courriel client — email non envoyé')
    }

    console.log(`✅ Vente complétée — ${date} / Envolée ${envol} — ${(amount / 100).toFixed(2)}$ CAD`)
  }

  return NextResponse.json({ received: true })
}
