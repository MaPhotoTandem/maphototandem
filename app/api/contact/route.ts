import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 })
  }

  // Validation email basique
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Adresse courriel invalide.' }, { status: 400 })
  }

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:#001F3F;padding:24px 32px;">
              <h1 style="color:#ffffff;margin:0;font-size:18px;font-weight:700;">📬 Nouveau message — Ma Photo Tandem</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#E6F0FF;border-radius:8px;padding:16px;margin-bottom:20px;">
                <tr><td style="padding:4px 0;"><span style="color:#001F3F;font-size:13px;font-weight:700;">Nom</span><span style="color:#444;font-size:13px;float:right;">${name}</span></td></tr>
                <tr><td style="padding:4px 0;"><span style="color:#001F3F;font-size:13px;font-weight:700;">Courriel</span><span style="color:#444;font-size:13px;float:right;">${email}</span></td></tr>
                ${subject ? `<tr><td style="padding:4px 0;"><span style="color:#001F3F;font-size:13px;font-weight:700;">Sujet</span><span style="color:#444;font-size:13px;float:right;">${subject}</span></td></tr>` : ''}
              </table>
              <p style="color:#001F3F;font-size:13px;font-weight:700;margin:0 0 8px;">Message</p>
              <div style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px;padding:16px;color:#333;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</div>
            </td>
          </tr>
          <tr>
            <td style="background:#f4f4f5;padding:16px 32px;text-align:center;">
              <p style="color:#aaa;font-size:12px;margin:0;">Répondre à : <a href="mailto:${email}" style="color:#0066CC;">${email}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'Ma Photo Tandem <noreply@send.maphototandem.com>',
      to: ['maphototandem@parachutemontreal.com'],
      reply_to: email,
      subject: subject ? `Contact : ${subject}` : `Nouveau message de ${name}`,
      html,
    }),
  })

  if (!resendRes.ok) {
    const err = await resendRes.text()
    console.error('Erreur Resend contact:', resendRes.status, err)
    return NextResponse.json({ error: 'Erreur envoi courriel.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
