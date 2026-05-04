import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'mpt-auth'

// Lit le rôle depuis le cookie — retourne null si absent ou invalide
function getRole(req: NextRequest): string | null {
  const cookie = req.cookies.get(COOKIE_NAME)
  if (!cookie) return null
  const parts = cookie.value.split('|')
  if (parts.length !== 2) return null
  const [token, role] = parts
  if (token !== process.env.ADMIN_SESSION_TOKEN) return null
  return role
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /connexion-studio : toujours accessible (page de login)
  if (pathname === '/connexion-studio') {
    return NextResponse.next()
  }

  // /admin exact : bloqué → page d'accueil
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // /admin/gestion/* : rôle gestion requis
  if (pathname.startsWith('/admin/gestion')) {
    if (getRole(req) !== 'gestion') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // /admin/photographe/* : rôle photographe requis
  if (pathname.startsWith('/admin/photographe')) {
    if (getRole(req) !== 'photographe') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // /admin/* autres : n'importe quel rôle valide
  if (pathname.startsWith('/admin')) {
    if (!getRole(req)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // /api/admin/login : toujours accessible (endpoint de login)
  if (pathname === '/api/admin/login') {
    return NextResponse.next()
  }

  // /api/admin/gestion/* : rôle gestion requis
  if (pathname.startsWith('/api/admin/gestion')) {
    if (getRole(req) !== 'gestion') {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // /api/admin/* autres : n'importe quel rôle valide
  if (pathname.startsWith('/api/admin')) {
    if (!getRole(req)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/connexion-studio'],
}
