'use client'

import { useState, useEffect } from 'react'
import { getManagerSession, setManagerSession, clearManagerSession, clearPhotographerSession } from '@/lib/manager-session'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Sale {
  sessionId: string
  downloadToken: string
  customerName: string | null
  customerEmail: string | null
  location: string
  date: string
  envol: string
  amount: number
  createdAt: string
  isActive: boolean
  expiresAt: string
  downloadUrl: string
}

type Filter = 'all' | 'rive-sud' | 'rive-nord'

// ── Helpers ───────────────────────────────────────────────────────────────────

const SUCCURSALES: Record<string, string> = {
  'rive-sud': 'Rive-Sud · Farnham',
  'rive-nord': 'Rive-Nord · St-Esprit',
}

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('fr-CA', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatAmount(cents: number): string {
  return `${(cents / 100).toFixed(2)} $`
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function VentesPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [managerPassword, setManagerPassword] = useState('')
  const [pw, setPw] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [sales, setSales] = useState<Sale[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [reactivating, setReactivating] = useState<string | null>(null)

  // Vérifier la session au chargement
  useEffect(() => {
    const session = getManagerSession()
    if (session.valid) {
      setAuthenticated(true)
      setManagerPassword(session.password)
    }
  }, [])

  // Charger les ventes une fois authentifié
  useEffect(() => {
    if (authenticated && managerPassword) {
      loadSales(managerPassword)
    }
  }, [authenticated, managerPassword])

  // ── Connexion ────────────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    const res = await fetch('/api/admin/ventes', {
      headers: { 'x-manager-password': pw },
    })
    setAuthLoading(false)
    if (res.status === 401) { setAuthError('Mot de passe incorrect.'); return }
    setManagerSession(pw)
    setManagerPassword(pw)
    setAuthenticated(true)
  }

  // ── Chargement des ventes ─────────────────────────────────────────────────

  async function loadSales(password: string) {
    setLoadingData(true)
    const res = await fetch('/api/admin/ventes', {
      headers: { 'x-manager-password': password },
    })
    setLoadingData(false)
    if (res.ok) {
      const data = await res.json()
      setSales(data.sales ?? [])
    }
  }

  // ── Réactiver un lien ─────────────────────────────────────────────────────

  async function reactivate(downloadToken: string) {
    setReactivating(downloadToken)
    const res = await fetch('/api/admin/reactivate-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-manager-password': managerPassword,
      },
      body: JSON.stringify({ downloadToken }),
    })
    setReactivating(null)
    if (res.ok) {
      const data = await res.json()
      setSales(prev => prev.map(s =>
        s.downloadToken === downloadToken
          ? { ...s, isActive: true, expiresAt: data.expiresAt }
          : s
      ))
    }
  }

  // ── Filtrage ──────────────────────────────────────────────────────────────

  const filtered = filter === 'all' ? sales : sales.filter(s => s.location === filter)
  const totalFiltered = filtered.reduce((sum, s) => sum + s.amount, 0)

  // ── VUE : Connexion ───────────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <form
          onSubmit={handleLogin}
          className="bg-noir border border-rouge/30 rounded-2xl p-8 w-full max-w-sm"
        >
          <h1 className="text-xl font-bold mb-1 text-white text-center">Gestion des ventes</h1>
          <p className="text-sm text-gris-pale/70 text-center mb-6">Ma Photo Tandem</p>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Mot de passe gestionnaire"
              value={pw}
              onChange={e => setPw(e.target.value)}
              className="input-field"
              autoFocus
              required
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              className="btn-primary w-full disabled:opacity-40"
            >
              {authLoading ? '...' : 'Accéder →'}
            </button>
            <div className="flex gap-2 pt-1">
              <a
                href="/admin/gestion"
                className="flex-1 text-center text-sm text-gris-pale/60 hover:text-gris-pale transition-colors"
              >
                ← Rive-Sud
              </a>
              <a
                href="/admin/gestion"
                className="flex-1 text-center text-sm text-gris-pale/60 hover:text-gris-pale transition-colors"
              >
                ← Rive-Nord
              </a>
            </div>
          </div>
        </form>
      </div>
    )
  }

  // ── VUE : Tableau des ventes ──────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-noir">Gestion des ventes</h1>
          <p className="text-sm text-gris-mid mt-1">
            {sales.length} vente{sales.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/gestion"
            className="text-sm font-semibold bg-gris-pale text-noir px-3 py-1.5 rounded-lg hover:bg-rouge hover:text-white transition-colors whitespace-nowrap"
          >
            📷 Rive-Sud
          </a>
          <a
            href="/admin/gestion"
            className="text-sm font-semibold bg-gris-pale text-noir px-3 py-1.5 rounded-lg hover:bg-rouge hover:text-white transition-colors whitespace-nowrap"
          >
            📷 Rive-Nord
          </a>
          <button
            onClick={() => {
              clearManagerSession()
              clearPhotographerSession()
              window.location.href = '/admin'
            }}
            className="text-sm text-gris-mid hover:text-noir transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Filtres succursale */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'rive-sud', 'rive-nord'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === f
                ? 'bg-rouge text-white'
                : 'bg-gris-pale text-noir hover:opacity-80'
            }`}
          >
            {f === 'all' ? 'Toutes les succursales' : SUCCURSALES[f]}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loadingData ? (
        <div className="text-center py-16 text-gris-mid">Chargement des ventes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-gris-pale rounded-2xl text-gris-mid">
          Aucune vente trouvée.
        </div>
      ) : (
        <>
          {/* Tableau */}
          <div className="overflow-x-auto rounded-2xl border border-gris-pale mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gris-pale text-noir">
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Date d'achat</th>
                  <th className="text-left px-4 py-3 font-semibold">Nom</th>
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Succursale</th>
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Date du saut</th>
                  <th className="text-center px-4 py-3 font-semibold">Envolée</th>
                  <th className="text-right px-4 py-3 font-semibold">Montant</th>
                  <th className="text-left px-4 py-3 font-semibold">Lien</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale, i) => (
                  <tr
                    key={sale.sessionId}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-gris-pale/30'}
                  >
                    <td className="px-4 py-3 text-noir whitespace-nowrap">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-noir font-medium">{sale.customerName ?? '—'}</div>
                      {sale.customerEmail && (
                        <div className="text-xs text-gris-mid">{sale.customerEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gris-mid whitespace-nowrap">
                      {sale.location ? (SUCCURSALES[sale.location] ?? sale.location) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gris-mid whitespace-nowrap">
                      {sale.date || '—'}
                    </td>
                    <td className="px-4 py-3 text-gris-mid text-center">
                      {sale.envol || '—'}
                    </td>
                    <td className="px-4 py-3 text-noir font-semibold text-right whitespace-nowrap">
                      {formatAmount(sale.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {sale.downloadToken ? (
                        sale.isActive ? (
                          <a
                            href={sale.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rouge font-medium hover:underline"
                          >
                            Actif →
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[#555] font-medium">Expiré</span>
                            <button
                              onClick={() => reactivate(sale.downloadToken)}
                              disabled={reactivating === sale.downloadToken}
                              className="text-xs bg-gris-pale text-noir px-2 py-1 rounded-md hover:bg-rouge hover:text-white transition-colors disabled:opacity-40 whitespace-nowrap"
                            >
                              {reactivating === sale.downloadToken ? '...' : 'Réactiver'}
                            </button>
                          </div>
                        )
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-gris-pale rounded-xl px-6 py-3 text-right">
              <p className="text-sm text-gris-mid">
                Total — {filtered.length} vente{filtered.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xl font-bold text-noir">{formatAmount(totalFiltered)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
