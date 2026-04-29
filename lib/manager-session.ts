// Gestion des sessions admin
// - Session gestionnaire : 5 minutes, partagée entre /admin et /admin/ventes
// - Session photographe : durée de l'onglet (sessionStorage), restaurée au retour sur /admin

const SESSION_KEY = 'managerAuth'
const SESSION_DURATION = 5 * 60 * 1000 // 5 minutes

export function getManagerSession(): { valid: boolean; password: string } {
  if (typeof window === 'undefined') return { valid: false, password: '' }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return { valid: false, password: '' }
    const { expiry, password } = JSON.parse(raw)
    if (Date.now() < expiry) return { valid: true, password }
    return { valid: false, password: '' }
  } catch {
    return { valid: false, password: '' }
  }
}

export function setManagerSession(password: string) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    expiry: Date.now() + SESSION_DURATION,
    password,
  }))
}

export function clearManagerSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

// ── Session photographe (durée de l'onglet) ───────────────────────────────────

const PHOTO_SESSION_KEY = 'photographerAuth'

export interface PhotographerSession {
  password: string
  location: 'rive-sud' | 'rive-nord'
}

export function getPhotographerSession(): PhotographerSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PHOTO_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PhotographerSession
  } catch {
    return null
  }
}

export function setPhotographerSession(data: PhotographerSession) {
  sessionStorage.setItem(PHOTO_SESSION_KEY, JSON.stringify(data))
}

export function clearPhotographerSession() {
  sessionStorage.removeItem(PHOTO_SESSION_KEY)
}
