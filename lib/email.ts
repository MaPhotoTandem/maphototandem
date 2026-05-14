// lib/email.ts — Template courriel partagé (Ma Photo Tandem)
// Utilisé par : webhook, resend-email, reactivate-token

// ─── Constantes ──────────────────────────────────────────────────────────────

export const SUCCURSALES: Record<string, string> = {
  'rive-sud':  'Rive-Sud · Farnham',
  'rive-nord': 'Rive-Nord · St-Esprit',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatExpiresAt(expiresAt: string): string {
  return new Date(expiresAt).toLocaleDateString('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Template HTML ───────────────────────────────────────────────────────────

export function buildEmailHtml({
  downloadUrl,
  photoCount,
  date,
  envol,
  succursaleLabel,
  amountFormatted,
  expiresFormatted,
  titre = 'Vos photos sont prêtes ! 🪂',
}: {
  downloadUrl: string
  photoCount: number
  date: string
  envol: string
  succursaleLabel: string
  amountFormatted: string
  expiresFormatted: string
  titre?: string
}): string {
  const photoLabel = photoCount === 1 ? 'votre photo' : `vos ${photoCount} photos`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ma Photo Tandem</title>
</head>
<body style="margin:0;padding:0;background:#F8F8F8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F8F8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

          <!-- En-tête -->
          <tr>
            <td style="background:#000000;padding:28px 32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Ma Photo Tandem
              </h1>
              <p style="color:#888888;margin:6px 0 0;font-size:13px;">Parachute Montréal</p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <h2 style="color:#000000;font-size:20px;margin:0 0 8px;font-weight:700;">
                ${titre}
              </h2>
              <p style="color:#4A4A4A;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Téléchargez ${photoLabel} en haute résolution grâce au lien ci-dessous.
              </p>

              <!-- Bouton principal -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td style="background:#D4252B;border-radius:8px;">
                    <a href="${downloadUrl}"
                       style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">
                      Télécharger mes photos →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration -->
              <p style="color:#000000;font-size:13px;font-weight:700;margin:0 0 16px;">
                ⏰ Ce lien est valide jusqu'au ${expiresFormatted}.
              </p>

              <!-- Lien copiable -->
              <p style="color:#4A4A4A;font-size:13px;margin:0 0 8px;">
                Vous pouvez aussi copier ce lien pour le partager avec vos proches :
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#F8F8F8;border:1px solid #E0E0E0;border-radius:8px;padding:10px 14px;">
                    <a href="${downloadUrl}"
                       style="color:#D4252B;font-size:12px;word-break:break-all;text-decoration:none;">
                      ${downloadUrl}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Détails de la commande -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#FDECEA;border-radius:8px;padding:16px;margin-bottom:8px;">
                <tr>
                  <td style="padding:5px 0;border-bottom:1px solid #F5C6C7;">
                    <span style="color:#000000;font-size:13px;font-weight:700;">Envolée</span>
                    <span style="color:#4A4A4A;font-size:13px;float:right;">${envol}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 0;border-bottom:1px solid #F5C6C7;">
                    <span style="color:#000000;font-size:13px;font-weight:700;">Date</span>
                    <span style="color:#4A4A4A;font-size:13px;float:right;">${date}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 0;border-bottom:1px solid #F5C6C7;">
                    <span style="color:#000000;font-size:13px;font-weight:700;">Succursale</span>
                    <span style="color:#4A4A4A;font-size:13px;float:right;">${succursaleLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 0;">
                    <span style="color:#000000;font-size:13px;font-weight:700;">Total payé</span>
                    <span style="color:#4A4A4A;font-size:13px;float:right;">${amountFormatted} $ CAD</span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="background:#F8F8F8;border-top:1px solid #E0E0E0;padding:20px 32px;text-align:center;">
              <p style="color:#888888;font-size:12px;margin:0;line-height:1.6;">
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
</html>`
}

// ─── Envoi via Resend ─────────────────────────────────────────────────────────

export async function sendDownloadEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'Ma Photo Tandem <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  })

  if (!resendRes.ok) {
    const errBody = await resendRes.text()
    console.error('Erreur Resend:', resendRes.status, errBody)
    return false
  }

  return true
}
