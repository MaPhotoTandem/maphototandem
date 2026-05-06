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
  const [showPassword, setShowPassword] = useState(false)
  const [location, setLocation] = useState<'rive-sud' | 'rive-nord' | ''>('')
  const [authError, setAuthError] = useState('')

  // Gestion
  const [gestionPw, setGestionPw] = useState('')
  const [showGestionPw, setShowGestionPw] = useState(false)
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe photographe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-pale-blue/50 hover:text-pale-blue transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button type="submit" className="btn-primary w-full">Accéder →</button>
          </form>
        )}

        {/* Formulaire Gestion */}
        {role === 'gestion' && (
          <form onSubmit={handleGestionLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showGestionPw ? 'text' : 'password'}
                placeholder="Mot de passe gestionnaire"
                value={gestionPw}
                onChange={(e) => setGestionPw(e.target.value)}
                className="input-field w-full pr-10"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowGestionPw((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-pale-blue/50 hover:text-pale-blue transition-colors"
                tabIndex={-1}
                aria-label={showGestionPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showGestionPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
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
