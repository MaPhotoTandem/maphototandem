// Webhook Stripe — appelé automatiquement par Stripe après chaque paiement réussi
// Sur checkout.session.completed :
//   1. Sauvegarde un token de téléchargement dans R2 (tokens/{token}.json)
//   2. Envoie un courriel au client via Resend avec le lien de téléchargement
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { saveDownloadToken } from '@/lib/r2'

const SUCCURSALES: Record<string, string> = {
  'rive-sud':  'Rive-Sud · Farnham',
  'rive-nord': 'Rive-Nord · St-Esprit',
}

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

    // 2. Envoyer le courriel via Resend (API REST — pas de package requis)
    if (email) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
        const downloadUrl = `${baseUrl}/tandem/download/${downloadToken}`
        const succursaleLabel = SUCCURSALES[location ?? ''] ?? location ?? ''
        const photoCount = photoIds.length
        const amountFormatted = (amount / 100).toFixed(2)

        const expiresFormatted = new Date(expiresAt).toLocaleDateString('fr-CA', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })

        const emailHtml = buildEmailHtml({
          downloadUrl,
          photoCount,
          date: date ?? '',
          envol: envol ?? '',
          succursaleLabel,
          amountFormatted,
          expiresFormatted,
        })

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL ?? 'Ma Photo Tandem <onboarding@resend.dev>',
            to: [email],
            subject: `Vos photos sont prêtes ! 🪂 📷 - Ma Photo Tandem`,
            html: emailHtml,
          }),
        })

        if (!resendRes.ok) {
          const errBody = await resendRes.text()
          console.error('Erreur Resend:', resendRes.status, errBody)
        } else {
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

// ─── Template email ───────────────────────────────────────────────────────────

function buildEmailHtml({
  downloadUrl,
  photoCount,
  date,
  envol,
  succursaleLabel,
  amountFormatted,
  expiresFormatted,
}: {
  downloadUrl: string
  photoCount: number
  date: string
  envol: string
  succursaleLabel: string
  amountFormatted: string
  expiresFormatted: string
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vos photos sont prêtes</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

          <!-- En-tête -->
          <tr>
            <td style="background:#001F3F;padding:28px 32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Ma Photo Tandem
              </h1>
              <p style="color:#a0b8d8;margin:6px 0 0;font-size:13px;">Parachute Montréal</p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <h2 style="color:#001F3F;font-size:20px;margin:0 0 8px;font-weight:700;">
                Vos photos sont prêtes ! 🪂
              </h2>
              <p style="color:#555555;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Merci pour votre achat. Voici votre lien pour télécharger
                ${photoCount === 1 ? 'votre photo' : `vos ${photoCount} photos`} en haute résolution.
              </p>

              <!-- Bouton principal -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td style="background:#0066CC;border-radius:8px;">
                    <a href="${downloadUrl}"
                       style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">
                      Télécharger mes photos →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration -->
              <p style="color:#001F3F;font-size:13px;font-weight:700;margin:0 0 4px;">
                ⏰ Ce lien est valide jusqu'au ${expiresFormatted}.
              </p>

              <!-- Lien copiable -->
              <p style="color:#555555;font-size:13px;margin:0 0 24px;">
                Partagez ce lien avec vos proches pour qu'ils téléchargent les photos aussi :
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#f4f4f5;border:1px solid #dddddd;border-radius:8px;padding:10px 14px;">
                    <a href="${downloadUrl}"
                       style="color:#0066CC;font-size:12px;word-break:break-all;text-decoration:none;">
                      ${downloadUrl}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Détails de la commande -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#E6F0FF;border-radius:8px;padding:16px;margin-bottom:20px;">
                <tr>
                  <td style="padding:4px 0;">
                    <span style="color:#001F3F;font-size:13px;font-weight:700;">Envolée</span>
                    <span style="color:#444444;font-size:13px;float:right;">${envol}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <span style="color:#001F3F;font-size:13px;font-weight:700;">Date</span>
                    <span style="color:#444444;font-size:13px;float:right;">${date}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <span style="color:#001F3F;font-size:13px;font-weight:700;">Succursale</span>
                    <span style="color:#444444;font-size:13px;float:right;">${succursaleLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <span style="color:#001F3F;font-size:13px;font-weight:700;">Total</span>
                    <span style="color:#444444;font-size:13px;float:right;">${amountFormatted} $ CAD</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="background:#f4f4f5;padding:20px 32px;text-align:center;">
              <p style="color:#aaaaaa;font-size:12px;margin:0;">
                Ma Photo Tandem · Parachute Montréal<br />
                Rive-Sud (Farnham) &amp; Rive-Nord (St-Esprit)
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
