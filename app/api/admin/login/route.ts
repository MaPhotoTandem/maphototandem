import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const COOKIE_NAME = 'mpt-auth'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 heures

// 5 tentatives maximum par IP par fenêtre de 15 minutes
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'mpt:login',
})

export async function POST(req: NextRequest) {
  // Vérifier la limite de tentatives par IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
      { status: 429 }
    )
  }

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
