// Réactiver un lien expiré — crée un nouveau token UUID + envoie le courriel
import { NextRequest, NextResponse } from 'next/server'
import { getDownloadToken, saveDownloadToken } from '@/lib/r2'
import { randomUUID } from 'crypto'

function authManager(req: NextRequest) {
  return req.headers.get('x-manager-password') === process.env.MANAGER_PASSWORD
}

const SUCCURSALES: Record<string, string> = {
  'rive-sud':  'Rive-Sud · Farnham',
  'rive-nord': 'Rive-Nord · St-Esprit',
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
      const expiresFormatted = new Date(newExpiresAt).toLocaleDateString('fr-CA', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
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
          subject: `Votre nouveau lien de téléchargement 🪂 📷 - Ma Photo Tandem`,
          html: buildEmailHtml({ downloadUrl, photoCount, date: tokenData.date, envol: tokenData.envol, succursaleLabel, amountFormatted, expiresFormatted }),
        }),
      })

      if (!resendRes.ok) {
        console.error('[reactivate] Erreur Resend:', resendRes.status, await resendRes.text())
      }
    }

    return NextResponse.json({ success: true, newToken, downloadUrl, expiresAt: newExpiresAt, emailSent: !!email })
  } catch (err) {
    console.error('[reactivate] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

function buildEmailHtml({ downloadUrl, photoCount, date, envol, succursaleLabel, amountFormatted, expiresFormatted }: {
  downloadUrl: string; photoCount: number; date: string; envol: string
  succursaleLabel: string; amountFormatted: string; expiresFormatted: string
}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:#001F3F;padding:28px 32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Ma Photo Tandem</h1>
            <p style="color:#a0b8d8;margin:6px 0 0;font-size:13px;">Parachute Montréal</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 24px;">
            <h2 style="color:#001F3F;font-size:20px;margin:0 0 8px;font-weight:700;">Votre nouveau lien est prêt 🪂</h2>
            <p style="color:#555555;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Un nouveau lien de téléchargement a été généré pour
              ${photoCount === 1 ? 'votre photo' : `vos ${photoCount} photos`} en haute résolution.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
              <tr>
                <td style="background:#0066CC;border-radius:8px;">
                  <a href="${downloadUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">
                    Télécharger mes photos →
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#001F3F;font-size:13px;font-weight:700;margin:0 0 4px;">⏰ Ce lien est valide jusqu'au ${expiresFormatted}.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
              <tr>
                <td style="background:#f4f4f5;border:1px solid #dddddd;border-radius:8px;padding:10px 14px;">
                  <a href="${downloadUrl}" style="color:#0066CC;font-size:12px;word-break:break-all;text-decoration:none;">${downloadUrl}</a>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#E6F0FF;border-radius:8px;padding:16px;">
              <tr><td style="padding:4px 0;"><span style="color:#001F3F;font-size:13px;font-weight:700;">Envolée</span><span style="color:#444;font-size:13px;float:right;">${envol}</span></td></tr>
              <tr><td style="padding:4px 0;"><span style="color:#001F3F;font-size:13px;font-weight:700;">Date</span><span style="color:#444;font-size:13px;float:right;">${date}</span></td></tr>
              <tr><td style="padding:4px 0;"><span style="color:#001F3F;font-size:13px;font-weight:700;">Succursale</span><span style="color:#444;font-size:13px;float:right;">${succursaleLabel}</span></td></tr>
              <tr><td style="padding:4px 0;"><span style="color:#001F3F;font-size:13px;font-weight:700;">Total</span><span style="color:#444;font-size:13px;float:right;">${amountFormatted} $ CAD</span></td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f4f5;padding:20px 32px;text-align:center;">
            <p style="color:#aaaaaa;font-size:12px;margin:0;">Ma Photo Tandem · Parachute Montréal<br/>Rive-Sud (Farnham) &amp; Rive-Nord (St-Esprit)</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
