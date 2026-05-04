import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'mpt-auth'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 heures

export async function POST(req: NextRequest) {
  const { role, password } = await req.json()

  let valid = false

  if (role === 'gestion') {
    valid = password === process.env.MANAGER_PASSWORD
  } else if (role === 'photographe') {
    valid = password === process.env.ADMIN_PASSWORD
  }

  if (!valid) {
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 })
  }

  const cookieValue = `${process.env.ADMIN_SESSION_TOKEN}|${role}`
  const res = NextResponse.json({ ok: true })

  res.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,      // Inaccessible au JavaScript du navigateur
    secure: true,        // HTTPS seulement
    sameSite: 'strict',  // Protège contre les attaques cross-site
    maxAge: COOKIE_MAX_AGE,
    path: '/admin',
  })

  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}
