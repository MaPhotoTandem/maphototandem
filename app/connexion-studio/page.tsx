'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getManagerSession, setManagerSession, getPhotographerSession, setPhotographerSession } from '@/lib/manager-session'

type Role = 'photographe' | 'gestion' | ''

export default function ConnexionStudioPage() {
  const router = useRouter()

  const [role, setRole] = useState<Role>('')
  const [authReady, setAuthReady] = useState(false)

  // Photographe
  const [password, setPassword] = useState('')
  const [location, setLocation] = useState<'rive-sud' | 'rive-nord' | ''>('')
  const [authError, setAuthError] = useState('')

  // Gestion
  const [gestionPw, setGestionPw] = useState('')
  const [gestionLoading, setGestionLoading] = useState(false)
  const [gestionError, setGestionError] = useState('')

  // ── Vérifier les sessions existantes au chargement ───────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const forcedRole = params.get('role') as Role | null

    if (forcedRole === 'photographe' || forcedRole === 'gestion') {
      setRole(forcedRole)
      setAuthReady(true)
      return
    }

    const managerSession = getManagerSession()
    if (managerSession.valid) {
      router.replace('/admin/gestion')
      return
    }

    const photoSession = getPhotographerSession()
    if (photoSession) {
      router.replace('/admin/photographe')
      return
    }

    setAuthReady(true)
  }, [router])

  // ── Login Gestion ─────────────────────────────────────────────────────────

  async function handleGestionLogin(e: React.FormEvent) {
    e.preventDefault()
    setGestionError('')
    setGestionLoading(true)
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'gestion', password: gestionPw }),
    })
    setGestionLoading(false)
    if (res.status === 429) { setGestionError('Trop de tentatives. Réessayez dans 15 minutes.'); return }
    if (res.status === 401) { setGestionError('Mot de passe incorrect.'); return }
    if (!res.ok) { setGestionError('Une erreur est survenue.'); return }
    setManagerSession(gestionPw)
    router.push('/admin/gestion')
  }

  // ── Login Photographe ─────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!location) { setAuthError('Sélectionnez une succursale.'); return }
    setAuthError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'photographe', password }),
    })
    if (res.status === 429) { setAuthError('Trop de tentatives. Réessayez dans 15 minutes.'); return }
    if (res.status === 401) { setAuthError('Mot de passe incorrect.'); return }
    if (!res.ok) { setAuthError('Une erreur est survenue.'); return }
    setPhotographerSession({ password, location: location as 'rive-sud' | 'rive-nord' })
    router.push('/admin/photographe')
  }

  // ── Pendant la vérification de session ────────────────────────────────────

  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] text-mid text-sm">
        Chargement...
      </div>
    )
  }

  // ── VUE : Login ───────────────────────────────────────────────────────────

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="bg-navy border border-action/30 rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-1 text-white text-center">Ma Photo Tandem</h1>
        <p className="text-sm text-pale-blue/70 text-center mb-6">Espace administration</p>

        {/* Sélecteur de rôle */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setRole('photographe'); setAuthError(''); setGestionError('') }}
            className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              role === 'photographe' ? 'bg-action text-white' : 'bg-pale-blue/20 text-pale-blue hover:bg-pale-blue/30'
            }`}
          >
            📷 Photographe
          </button>
          <button
            type="button"
            onClick={() => { setRole('gestion'); setAuthError(''); setGestionError('') }}
            className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              role === 'gestion' ? 'bg-action text-white' : 'bg-pale-blue/20 text-pale-blue hover:bg-pale-blue/30'
            }`}
          >
            📊 Gestion
          </button>
        </div>

        {/* Formulaire Photographe */}
        {role === 'photographe' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocation('rive-sud')}
                className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location === 'rive-sud' ? 'bg-action text-white' : 'bg-pale-blue text-navy hover:opacity-80'
                }`}
              >
                Rive-Sud
              </button>
              <button
                type="button"
                onClick={() => setLocation('rive-nord')}
                className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location === 'rive-nord' ? 'bg-action text-white' : 'bg-pale-blue text-navy hover:opacity-80'
                }`}
              >
                Rive-Nord
              </button>
            </div>
            <input
              type="password"
              placeholder="Mot de passe photographe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button type="submit" className="btn-primary w-full">Accéder →</button>
          </form>
        )}

        {/* Formulaire Gestion */}
        {role === 'gestion' && (
          <form onSubmit={handleGestionLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Mot de passe gestionnaire"
              value={gestionPw}
              onChange={(e) => setGestionPw(e.target.value)}
              className="input-field"
              autoFocus
              required
            />
            {gestionError && <p className="text-red-400 text-sm">{gestionError}</p>}
            <button
              type="submit"
              disabled={gestionLoading}
              className="btn-primary w-full disabled:opacity-40"
            >
              {gestionLoading ? '...' : 'Accéder →'}
            </button>
          </form>
        )}

        {role === '' && (
          <p className="text-center text-pale-blue/50 text-sm">Sélectionnez un rôle pour continuer.</p>
        )}
      </div>
    </div>
  )
}
