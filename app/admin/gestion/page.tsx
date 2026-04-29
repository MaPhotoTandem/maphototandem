'use client'

import { useState, useEffect, useRef } from 'react'
import { getManagerSession, setManagerSession, clearManagerSession, clearPhotographerSession } from '@/lib/manager-session'

// ── DateRangePicker ────────────────────────────────────────────────────────────

function DateRangePicker({
  from, to, onChange, maxDate,
}: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
  maxDate?: string
}) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [viewYear, setViewYear] = useState(() => {
    const d = from ? new Date(from + 'T12:00:00') : new Date()
    return d.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const d = from ? new Date(from + 'T12:00:00') : new Date()
    return d.getMonth()
  })
  const ref = useRef<HTMLDivElement>(null)

  // Fermer si clic extérieur
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const today = maxDate || new Date().toISOString().split('T')[0]

  // Jours du mois affiché
  const firstDay = new Date(viewYear, viewMonth, 1).getDay() // 0=dim
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const pad = (firstDay + 6) % 7 // lundi = 0

  function toISO(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function handleDayClick(iso: string) {
    if (iso > today) return
    if (!from || (from && to)) {
      // Démarrer nouvelle sélection
      onChange(iso, '')
    } else {
      // Deuxième clic = fin
      if (iso < from) { onChange(iso, from) }
      else { onChange(from, iso) }
      setOpen(false)
    }
  }

  function dayState(iso: string) {
    const active = hovered && from && !to ? hovered : to
    const rangeEnd = active && from ? (active < from ? from : active) : to
    const rangeStart = active && from && active < from ? active : from
    if (iso === from || iso === to) return 'selected'
    if (rangeStart && rangeEnd && iso > rangeStart && iso < rangeEnd) return 'inrange'
    return 'none'
  }

  const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
  const DAYS_FR = ['Lu','Ma','Me','Je','Ve','Sa','Di']

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    const now = new Date()
    if (viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const label = from && to
    ? `${from} → ${to}`
    : from
    ? `${from} → …`
    : 'Toutes les dates'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`input-field text-xs py-1.5 px-3 flex items-center gap-2 ${from || to ? 'text-navy font-medium' : 'text-mid'}`}
      >
        <span>📅</span>
        <span>{label}</span>
        {(from || to) && (
          <span
            className="ml-1 text-mid hover:text-navy"
            onClick={(e) => { e.stopPropagation(); onChange('', ''); }}
          >✕</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-72">
          {/* Navigation mois */}
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="text-mid hover:text-navy px-2 py-1 rounded">‹</button>
            <span className="text-sm font-semibold text-navy">{MONTHS_FR[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className="text-mid hover:text-navy px-2 py-1 rounded">›</button>
          </div>

          {/* En-têtes jours */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_FR.map(d => (
              <div key={d} className="text-center text-xs text-mid font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Grille jours */}
          <div className="grid grid-cols-7">
            {Array.from({ length: pad }).map((_, i) => <div key={`pad-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const iso = toISO(viewYear, viewMonth, i + 1)
              const disabled = iso > today
              const state = dayState(iso)
              return (
                <button
                  key={iso}
                  disabled={disabled}
                  onClick={() => handleDayClick(iso)}
                  onMouseEnter={() => setHovered(iso)}
                  onMouseLeave={() => setHovered(null)}
                  className={[
                    'text-xs py-1 rounded text-center transition-colors',
                    disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                    state === 'selected' ? 'bg-navy text-white font-bold' : '',
                    state === 'inrange' ? 'bg-blue-100 text-navy' : '',
                    state === 'none' && !disabled ? 'hover:bg-gray-100 text-gray-700' : '',
                  ].join(' ')}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          {from && !to && (
            <p className="text-xs text-mid text-center mt-2">Clique sur la date de fin</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'ventes' | 'galeries'
type GalleryStatus = 'pending' | 'active' | 'expired' | 'archived'
type TokenStatus = 'active' | 'expired' | 'archived'

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
  galleryArchived?: boolean
}

interface Gallery {
  location: string
  date: string
  envol: string
  status: GalleryStatus
  activatedAt?: string
  expiresAt?: string
  photoCount: number
  storageBytes: number
  salesCount: number
}

interface DashboardData {
  salesToday: number
  revenueTodayCents: number
  salesTotal: number
  revenueTotalCents: number
  activeGalleriesCount: number
  expiringSoonCount: number
  storageBytes: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SUCCURSALES: Record<string, string> = {
  'rive-sud': 'Rive-Sud',
  'rive-nord': 'Rive-Nord',
}

function formatDate(isoStr: string): string {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleDateString('fr-CA', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatDateShort(isoStr: string): string {
  if (!isoStr) return '—'
  // Si c'est une date ISO sans heure (ex: 2026-04-15)
  const d = isoStr.includes('T') ? new Date(isoStr) : new Date(isoStr + 'T12:00:00')
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(isoStr: string): string {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleString('fr-CA', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function formatAmount(cents: number): string {
  return `${(cents / 100).toFixed(2)} $`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}

function tokenStatus(sale: Sale): TokenStatus {
  if (sale.galleryArchived) return 'archived'
  return sale.isActive ? 'active' : 'expired'
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function GestionPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [managerPassword, setManagerPassword] = useState('')
  const [pw, setPw] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('dashboard')

  // Dashboard
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)

  // Ventes
  const [sales, setSales] = useState<Sale[]>([])
  const [salesLoading, setSalesLoading] = useState(false)
  const [reactivating, setReactivating] = useState<string | null>(null)
  const [resending, setResending] = useState<string | null>(null)
  const [resendFeedback, setResendFeedback] = useState<{ token: string; ok: boolean } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [salesFilter, setSalesFilter] = useState<'all' | 'rive-sud' | 'rive-nord'>('all')
  const [salesSearch, setSalesSearch] = useState('')
  const [salesVisibleCount, setSalesVisibleCount] = useState(15)
  const [photoPopup, setPhotoPopup] = useState<{ sale: Sale; photos: { id: string; url: string; filename: string }[] } | null>(null)
  const [photoPopupLoading, setPhotoPopupLoading] = useState(false)

  // Galeries
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [galleriesLoading, setGalleriesLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [storageBytes, setStorageBytes] = useState(0)
  // Galerie ouverte pour modification (section pending)
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null)

  // Galeries actives — filtres et sélection
  const [activeFilterLoc, setActiveFilterLoc] = useState<'all' | 'rive-sud' | 'rive-nord'>('all')
  const [activeDateFrom, setActiveDateFrom] = useState('')
  const [activeDateTo, setActiveDateTo] = useState('')
  const [activeVisibleCount, setActiveVisibleCount] = useState(15)
  const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(new Set())
  const [bulkDeactivating, setBulkDeactivating] = useState(false)

  // ── Auth ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const session = getManagerSession()
    if (session.valid) {
      setAuthenticated(true)
      setManagerPassword(session.password)
    }
  }, [])

  useEffect(() => {
    if (authenticated && managerPassword) {
      loadDashboard(managerPassword)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, managerPassword])

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

  function logout() {
    clearManagerSession()
    clearPhotographerSession()
    window.location.href = '/admin'
  }

  // ── Chargements ─────────────────────────────────────────────────────────────

  async function loadDashboard(password: string) {
    setDashboardLoading(true)
    const res = await fetch('/api/admin/gestion/dashboard', {
      headers: { 'x-manager-password': password },
    })
    setDashboardLoading(false)
    if (res.ok) setDashboard(await res.json())
  }

  async function loadSales(password: string) {
    setSalesLoading(true)
    const res = await fetch('/api/admin/ventes', {
      headers: { 'x-manager-password': password },
    })
    setSalesLoading(false)
    if (res.ok) {
      const data = await res.json()
      setSales(data.sales ?? [])
    }
  }

  async function loadGalleries(password: string) {
    setGalleriesLoading(true)
    const res = await fetch('/api/admin/gestion/galeries/list', {
      headers: { 'x-manager-password': password },
    })
    setGalleriesLoading(false)
    if (res.ok) {
      const data = await res.json()
      const gals: Gallery[] = data.galleries ?? []
      setGalleries(gals)
      setStorageBytes(gals.reduce((s, g) => s + g.storageBytes, 0))
    }
  }

  function switchTab(t: Tab) {
    setTab(t)
    setEditingGallery(null)
    if (t === 'ventes' && sales.length === 0) loadSales(managerPassword)
    if (t === 'galeries' && galleries.length === 0) loadGalleries(managerPassword)
  }

  // ── Actions ventes ──────────────────────────────────────────────────────────

  async function reactivate(downloadToken: string) {
    setReactivating(downloadToken)
    const res = await fetch('/api/admin/reactivate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-manager-password': managerPassword },
      body: JSON.stringify({ downloadToken }),
    })
    setReactivating(null)
    if (res.ok) {
      const data = await res.json()
      // Mettre à jour avec le nouveau token, la nouvelle URL et la nouvelle expiration
      setSales((prev) =>
        prev.map((s) =>
          s.downloadToken === downloadToken
            ? {
                ...s,
                downloadToken: data.newToken,
                downloadUrl: data.downloadUrl,
                isActive: true,
                expiresAt: data.expiresAt,
              }
            : s
        )
      )
    }
  }

  function copyLink(downloadUrl: string, downloadToken: string) {
    navigator.clipboard.writeText(downloadUrl).then(() => {
      setCopied(downloadToken)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  async function resendEmail(sale: Sale) {
    setResending(sale.downloadToken)
    setResendFeedback(null)
    const res = await fetch('/api/admin/resend-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-manager-password': managerPassword },
      body: JSON.stringify({
        downloadToken: sale.downloadToken,
        customerEmail: sale.customerEmail,
        customerName: sale.customerName,
      }),
    })
    setResending(null)
    setResendFeedback({ token: sale.downloadToken, ok: res.ok })
    setTimeout(() => setResendFeedback(null), 3000)
  }

  async function openPhotoPopup(sale: Sale) {
    setPhotoPopup({ sale, photos: [] })
    setPhotoPopupLoading(true)
    const res = await fetch(
      `/api/admin/token-photos?downloadToken=${sale.downloadToken}`,
      { headers: { 'x-manager-password': managerPassword } }
    )
    setPhotoPopupLoading(false)
    if (res.ok) {
      const data = await res.json()
      setPhotoPopup({ sale, photos: data.photos ?? [] })
    }
  }

  // ── Actions galeries ────────────────────────────────────────────────────────

  function galleryKey(g: { location: string; date: string; envol: string }) {
    return `${g.location}/${g.date}/${g.envol}`
  }

  async function approveGallery(g: Gallery) {
    const key = galleryKey(g)
    setActionLoading(key)
    const res = await fetch('/api/admin/gestion/galeries/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-manager-password': managerPassword },
      body: JSON.stringify({ location: g.location, date: g.date, envol: g.envol }),
    })
    setActionLoading(null)
    if (res.ok) {
      const data = await res.json()
      setGalleries((prev) =>
        prev.map((x) =>
          galleryKey(x) === key ? { ...x, status: 'active', expiresAt: data.expiresAt } : x
        )
      )
    }
  }

  async function approveAll(pending: Gallery[]) {
    setActionLoading('approve-all')
    const res = await fetch('/api/admin/gestion/galeries/approve-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-manager-password': managerPassword },
      body: JSON.stringify({
        galleries: pending.map((g) => ({ location: g.location, date: g.date, envol: g.envol })),
      }),
    })
    setActionLoading(null)
    if (res.ok) {
      const data = await res.json()
      const keys = new Set(pending.map(galleryKey))
      setGalleries((prev) =>
        prev.map((x) =>
          keys.has(galleryKey(x)) ? { ...x, status: 'active', expiresAt: data.expiresAt } : x
        )
      )
    }
  }

  async function deactivateGallery(g: Gallery) {
    if (!confirm(`Désactiver la galerie ${g.location} ${g.date} envolée ${g.envol} ?`)) return
    const key = galleryKey(g)
    setActionLoading(key + '-deactivate')
    const res = await fetch('/api/admin/gestion/galeries/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-manager-password': managerPassword },
      body: JSON.stringify({ location: g.location, date: g.date, envol: g.envol }),
    })
    setActionLoading(null)
    if (res.ok) {
      setGalleries((prev) =>
        prev.map((x) => galleryKey(x) === key ? { ...x, status: 'expired' } : x)
      )
    }
  }

  async function deactivateBulk(keys: string[]) {
    if (!confirm(`Désactiver ${keys.length} galerie${keys.length > 1 ? 's' : ''} ?`)) return
    setBulkDeactivating(true)
    const toDeactivate = galleries.filter((g) => keys.includes(galleryKey(g)))
    await Promise.all(
      toDeactivate.map((g) =>
        fetch('/api/admin/gestion/galeries/deactivate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-manager-password': managerPassword },
          body: JSON.stringify({ location: g.location, date: g.date, envol: g.envol }),
        })
      )
    )
    setBulkDeactivating(false)
    setGalleries((prev) =>
      prev.map((x) => keys.includes(galleryKey(x)) ? { ...x, status: 'expired' } : x)
    )
    setSelectedGalleries(new Set())
  }

  async function extendGallery(g: Gallery) {
    const key = galleryKey(g)
    setActionLoading(key + '-extend')
    const res = await fetch('/api/admin/gestion/galeries/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-manager-password': managerPassword },
      body: JSON.stringify({ location: g.location, date: g.date, envol: g.envol }),
    })
    setActionLoading(null)
    if (res.ok) {
      const data = await res.json()
      setGalleries((prev) =>
        prev.map((x) => galleryKey(x) === key ? { ...x, expiresAt: data.expiresAt, status: 'active' } : x)
      )
    }
  }

  async function deleteGallery(g: Gallery) {
    if (!confirm(`Supprimer définitivement toutes les images de cette galerie de R2 ?\n\n${SUCCURSALES[g.location] ?? g.location} · ${g.date} · Envolée ${g.envol}\n\nCette action est irréversible.`)) return
    const key = galleryKey(g)
    setActionLoading(key + '-delete')
    const res = await fetch('/api/admin/gestion/galeries/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-manager-password': managerPassword },
      body: JSON.stringify({ location: g.location, date: g.date, envol: g.envol }),
    })
    setActionLoading(null)
    if (res.ok) {
      setGalleries((prev) =>
        prev.map((x) => galleryKey(x) === key ? { ...x, status: 'archived', photoCount: 0, storageBytes: 0 } : x)
      )
    }
  }

  // ── VUE : Login ─────────────────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <form
          onSubmit={handleLogin}
          className="bg-navy border border-action/30 rounded-2xl p-8 w-full max-w-sm"
        >
          <h1 className="text-xl font-bold mb-1 text-white text-center">Gestion</h1>
          <p className="text-sm text-pale-blue/70 text-center mb-6">Ma Photo Tandem</p>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Mot de passe gestionnaire"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
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
            <a
              href="/admin"
              className="block text-center text-sm text-pale-blue/60 hover:text-pale-blue transition-colors pt-1"
            >
              ← Retour
            </a>
          </div>
        </form>
      </div>
    )
  }

  // ── VUE : Galerie ouverte (mode édition pending) ──────────────────────────

  if (editingGallery) {
    return (
      <GalleryEditor
        gallery={editingGallery}
        managerPassword={managerPassword}
        onBack={() => setEditingGallery(null)}
        onApprove={async () => {
          await approveGallery(editingGallery)
          setEditingGallery(null)
        }}
      />
    )
  }

  // ── VUE : Hub principal ──────────────────────────────────────────────────────

  const pendingGalleries = galleries.filter((g) => g.status === 'pending')
  const activeGalleries = galleries.filter((g) => g.status === 'active')
  const expiredGalleries = galleries.filter((g) => g.status === 'expired')
  const pendingRiveNord = pendingGalleries.filter((g) => g.location === 'rive-nord')
  const pendingRiveSud = pendingGalleries.filter((g) => g.location === 'rive-sud')

  const filteredSales = sales
    .filter((s) => salesFilter === 'all' || s.location === salesFilter)
    .filter((s) => {
      if (!salesSearch.trim()) return true
      const q = salesSearch.toLowerCase()
      return (
        (s.customerName ?? '').toLowerCase().includes(q) ||
        (s.customerEmail ?? '').toLowerCase().includes(q)
      )
    })

  const filteredActiveGalleries = activeGalleries
    .filter((g) => activeFilterLoc === 'all' || g.location === activeFilterLoc)
    .filter((g) => !activeDateFrom || g.date >= activeDateFrom)
    .filter((g) => !activeDateTo || g.date <= activeDateTo)
  const visibleActiveGalleries = filteredActiveGalleries.slice(0, activeVisibleCount)
  const visibleSales = filteredSales.slice(0, salesVisibleCount)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-navy">Gestion</h1>
        <div className="flex items-center gap-4">
          <a
            href="/admin?role=photographe"
            className="text-sm text-mid hover:text-navy transition-colors"
          >
            📷 Photographe
          </a>
          <button
            onClick={logout}
            className="text-sm text-mid hover:text-navy transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-pale-blue rounded-xl p-1 mb-8 w-fit">
        {(['dashboard', 'ventes', 'galeries'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
              tab === t ? 'bg-white text-navy shadow-sm' : 'text-mid hover:text-navy'
            }`}
          >
            {t === 'dashboard' ? '📊 Dashboard' : t === 'ventes' ? '💳 Ventes' : '🖼 Galeries'}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div>
          {dashboardLoading ? (
            <p className="text-mid text-center py-12">Chargement...</p>
          ) : dashboard ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Ventes aujourd'hui" value={String(dashboard.salesToday)} sub={formatAmount(dashboard.revenueTodayCents)} />
              <StatCard label="Ventes totales" value={String(dashboard.salesTotal)} sub={formatAmount(dashboard.revenueTotalCents)} />
              <StatCard label="Galeries actives" value={String(dashboard.activeGalleriesCount)} />
              <StatCard
                label="Expirent bientôt"
                value={String(dashboard.expiringSoonCount)}
                accent={dashboard.expiringSoonCount > 0}
              />
              <StatCard label="Stockage R2" value={formatBytes(dashboard.storageBytes)} />
              <StatCard label="En attente" value={String(pendingGalleries.length)} accent={pendingGalleries.length > 0} />
            </div>
          ) : (
            <p className="text-mid text-center py-12">Aucune donnée.</p>
          )}
          <button
            onClick={() => loadDashboard(managerPassword)}
            className="mt-6 text-sm text-mid hover:text-navy transition-colors"
          >
            ↻ Actualiser
          </button>
        </div>
      )}

      {/* ── VENTES ────────────────────────────────────────────────────────── */}
      {tab === 'ventes' && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {(['all', 'rive-sud', 'rive-nord'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setSalesFilter(f); setSalesVisibleCount(15) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    salesFilter === f ? 'bg-action text-white' : 'bg-pale-blue text-navy hover:opacity-80'
                  }`}
                >
                  {f === 'all' ? 'Toutes' : SUCCURSALES[f]}
                </button>
              ))}
            </div>
            <button
              onClick={() => loadSales(managerPassword)}
              className="text-sm text-mid hover:text-navy transition-colors"
            >
              ↻ Actualiser
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mid text-sm">🔍</span>
            <input
              type="text"
              placeholder="Nom ou courriel..."
              value={salesSearch}
              onChange={(e) => { setSalesSearch(e.target.value); setSalesVisibleCount(15) }}
              className="input-field pl-9 w-full max-w-xs text-sm py-2"
            />
            {salesSearch && (
              <button
                onClick={() => setSalesSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mid hover:text-navy text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {salesLoading ? (
            <p className="text-mid text-center py-12">Chargement des ventes...</p>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-16 bg-pale-blue rounded-2xl text-mid text-sm">Aucune vente trouvée.</div>
          ) : (
            <>
              <div className="rounded-2xl border border-pale-blue overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-pale-blue text-navy">
                      <th className="text-left px-3 py-2 font-semibold">Statut</th>
                      <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Achat</th>
                      <th className="text-left px-3 py-2 font-semibold">Client</th>
                      <th className="text-left px-3 py-2 font-semibold">Galerie</th>
                      <th className="text-right px-3 py-2 font-semibold">Montant</th>
                      <th className="text-left px-3 py-2 font-semibold whitespace-nowrap">Exp. lien</th>
                      <th className="text-left px-3 py-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSales.map((sale, i) => {
                      const status = tokenStatus(sale)
                      return (
                        <tr key={sale.sessionId} className={i % 2 === 0 ? 'bg-white' : 'bg-pale-blue/30'}>
                          <td className="px-3 py-2">
                            <TokenStatusBadge status={status} />
                          </td>
                          <td className="px-3 py-2 text-mid whitespace-nowrap">{formatDate(sale.createdAt)}</td>
                          <td className="px-3 py-2">
                            <div className="text-navy font-medium leading-tight">{sale.customerName ?? '—'}</div>
                            {sale.customerEmail && <div className="text-mid truncate max-w-[160px]">{sale.customerEmail}</div>}
                          </td>
                          <td className="px-3 py-2 text-mid whitespace-nowrap">
                            <div>{SUCCURSALES[sale.location] ?? (sale.location || '—')}</div>
                            <div className="text-mid">{formatDateShort(sale.date)} · Env.{sale.envol || '—'}</div>
                          </td>
                          <td className="px-3 py-2 text-navy font-semibold text-right whitespace-nowrap">
                            {formatAmount(sale.amount)}
                          </td>
                          <td className="px-3 py-2 text-mid whitespace-nowrap">
                            {sale.expiresAt ? formatDateTime(sale.expiresAt) : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-1">
                              {/* Voir photos — toujours disponible */}
                              <button
                                onClick={() => openPhotoPopup(sale)}
                                className="text-xs font-semibold bg-pale-blue text-navy px-2 py-1 rounded-lg hover:bg-action hover:text-white transition-colors whitespace-nowrap"
                              >
                                🖼 Voir photos
                              </button>
                              {/* ACTIF — copier + renvoyer */}
                              {status === 'active' && (
                                <>
                                  <button
                                    onClick={() => copyLink(sale.downloadUrl, sale.downloadToken)}
                                    className="text-xs font-semibold bg-pale-blue text-navy px-2 py-1 rounded-lg hover:bg-action hover:text-white transition-colors whitespace-nowrap"
                                  >
                                    {copied === sale.downloadToken ? '✓ Copié !' : '🔗 Copier le lien'}
                                  </button>
                                  <button
                                    onClick={() => resendEmail(sale)}
                                    disabled={resending === sale.downloadToken || !sale.customerEmail}
                                    className="text-xs font-semibold bg-pale-blue text-navy px-2 py-1 rounded-lg hover:bg-action hover:text-white transition-colors disabled:opacity-40 whitespace-nowrap"
                                    title={!sale.customerEmail ? 'Aucun courriel associé' : ''}
                                  >
                                    {resending === sale.downloadToken
                                      ? '...'
                                      : resendFeedback?.token === sale.downloadToken
                                        ? resendFeedback.ok ? '✓ Envoyé !' : '✗ Erreur'
                                        : '📧 Renvoyer'}
                                  </button>
                                </>
                              )}
                              {/* EXPIRÉ — réactiver */}
                              {status === 'expired' && (
                                <button
                                  onClick={() => reactivate(sale.downloadToken)}
                                  disabled={reactivating === sale.downloadToken}
                                  className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-40 whitespace-nowrap"
                                >
                                  {reactivating === sale.downloadToken ? '...' : 'Réactiver'}
                                </button>
                              )}
                              {/* ARCHIVÉ — aucune action possible */}
                              {status === 'archived' && (
                                <button
                                  disabled
                                  className="text-xs font-semibold bg-red-100 text-red-400 px-2 py-1 rounded-lg cursor-default whitespace-nowrap"
                                >
                                  Archivé
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-mid">{Math.min(salesVisibleCount, filteredSales.length)} / {filteredSales.length} ventes</p>
                <div className="flex gap-3">
                  {filteredSales.length > salesVisibleCount && (
                    <button
                      onClick={() => setSalesVisibleCount((n) => n + 15)}
                      className="text-xs font-semibold text-action hover:underline"
                    >
                      Voir plus ({filteredSales.length - salesVisibleCount} restantes)
                    </button>
                  )}
                  {salesVisibleCount > 15 && (
                    <button
                      onClick={() => setSalesVisibleCount(15)}
                      className="text-xs font-semibold text-mid hover:text-navy hover:underline"
                    >
                      Voir moins
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Popup photos */}
          {photoPopup && (
            <PhotoPopupModal
              sale={photoPopup.sale}
              photos={photoPopup.photos}
              loading={photoPopupLoading}
              onClose={() => setPhotoPopup(null)}
            />
          )}
        </div>
      )}

      {/* ── GALERIES ──────────────────────────────────────────────────────── */}
      {tab === 'galeries' && (
        <div>
          {/* Stockage */}
          <div className="bg-pale-blue rounded-xl px-5 py-3 mb-6 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-navy">Stockage R2 utilisé</span>
            <span className="text-lg font-bold text-navy">{formatBytes(storageBytes)}</span>
          </div>

          {galleriesLoading ? (
            <p className="text-mid text-center py-12">Chargement des galeries...</p>
          ) : (
            <>
              {/* Section A — Pending */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-navy">
                    En attente d'approbation
                    {pendingGalleries.length > 0 && (
                      <span className="ml-2 text-sm font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        {pendingGalleries.length}
                      </span>
                    )}
                  </h2>
                  {pendingGalleries.length > 1 && (
                    <button
                      onClick={() => approveAll(pendingGalleries)}
                      disabled={actionLoading === 'approve-all'}
                      className="text-sm font-semibold bg-action text-white px-4 py-2 rounded-lg hover:bg-action/90 transition-colors disabled:opacity-40"
                    >
                      {actionLoading === 'approve-all' ? '...' : `✓ Tout publier (${pendingGalleries.length})`}
                    </button>
                  )}
                </div>

                {pendingGalleries.length === 0 ? (
                  <div className="text-center py-8 bg-pale-blue/50 rounded-xl text-mid text-sm">
                    Aucune galerie en attente.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rive-Nord */}
                    <PendingColumn
                      title="Rive-Nord"
                      galleries={pendingRiveNord}
                      actionLoading={actionLoading}
                      onApprove={approveGallery}
                      onEdit={setEditingGallery}
                    />
                    {/* Rive-Sud */}
                    <PendingColumn
                      title="Rive-Sud"
                      galleries={pendingRiveSud}
                      actionLoading={actionLoading}
                      onApprove={approveGallery}
                      onEdit={setEditingGallery}
                    />
                  </div>
                )}
              </section>

              {/* Section B — Active */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <h2 className="text-lg font-bold text-navy">
                    Galeries actives
                    {activeGalleries.length > 0 && (
                      <span className="ml-2 text-sm font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {activeGalleries.length}
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['all', 'rive-sud', 'rive-nord'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => { setActiveFilterLoc(f); setActiveVisibleCount(15); setSelectedGalleries(new Set()) }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          activeFilterLoc === f ? 'bg-action text-white' : 'bg-pale-blue text-navy hover:opacity-80'
                        }`}
                      >
                        {f === 'all' ? 'Toutes' : SUCCURSALES[f]}
                      </button>
                    ))}
                    <DateRangePicker
                      from={activeDateFrom}
                      to={activeDateTo}
                      onChange={(f, t) => { setActiveDateFrom(f); setActiveDateTo(t); setActiveVisibleCount(15); setSelectedGalleries(new Set()) }}
                    />
                  </div>
                </div>

                {/* Barre d'action bulk */}
                {selectedGalleries.size > 0 && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-amber-700">
                      {selectedGalleries.size} galerie{selectedGalleries.size > 1 ? 's' : ''} sélectionnée{selectedGalleries.size > 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {(activeDateFrom || activeDateTo) && filteredActiveGalleries.length > selectedGalleries.size && (
                        <button
                          onClick={() => setSelectedGalleries(new Set(filteredActiveGalleries.map(galleryKey)))}
                          className="text-xs font-semibold bg-pale-blue text-navy px-3 py-1.5 rounded-lg hover:opacity-80 transition-colors whitespace-nowrap"
                        >
                          Tout sélectionner ({filteredActiveGalleries.length})
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedGalleries(new Set())}
                        className="text-xs font-semibold bg-pale-blue text-mid px-3 py-1.5 rounded-lg hover:opacity-80 transition-colors whitespace-nowrap"
                      >
                        Désélectionner
                      </button>
                      <button
                        onClick={() => deactivateBulk(Array.from(selectedGalleries))}
                        disabled={bulkDeactivating}
                        className="text-xs font-semibold bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-40 whitespace-nowrap"
                      >
                        {bulkDeactivating ? '...' : `Désactiver (${selectedGalleries.size})`}
                      </button>
                    </div>
                  </div>
                )}

                {/* Tout sélectionner pour la plage de dates (quand filtre date actif, pas encore en sélection) */}
                {(activeDateFrom || activeDateTo) && filteredActiveGalleries.length > 0 && selectedGalleries.size === 0 && (
                  <div className="mb-3">
                    <button
                      onClick={() => setSelectedGalleries(new Set(filteredActiveGalleries.map(galleryKey)))}
                      className="text-xs font-semibold text-action hover:underline"
                    >
                      Tout sélectionner pour cette période ({filteredActiveGalleries.length})
                    </button>
                  </div>
                )}

                {activeGalleries.length === 0 ? (
                  <div className="text-center py-8 bg-pale-blue/50 rounded-xl text-mid text-sm">
                    Aucune galerie active.
                  </div>
                ) : filteredActiveGalleries.length === 0 ? (
                  <div className="text-center py-8 bg-pale-blue/50 rounded-xl text-mid text-sm">
                    Aucun résultat pour ces filtres.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-2xl border border-pale-blue">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-pale-blue text-navy">
                            <th className="px-4 py-3 w-8">
                              <input
                                type="checkbox"
                                checked={visibleActiveGalleries.length > 0 && visibleActiveGalleries.every((g) => selectedGalleries.has(galleryKey(g)))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGalleries((prev) => {
                                      const next = new Set(prev)
                                      visibleActiveGalleries.forEach((g) => next.add(galleryKey(g)))
                                      return next
                                    })
                                  } else {
                                    setSelectedGalleries((prev) => {
                                      const next = new Set(prev)
                                      visibleActiveGalleries.forEach((g) => next.delete(galleryKey(g)))
                                      return next
                                    })
                                  }
                                }}
                                className="cursor-pointer"
                              />
                            </th>
                            <th className="text-left px-4 py-3 font-semibold">Galerie</th>
                            <th className="text-left px-4 py-3 font-semibold">Succursale</th>
                            <th className="text-center px-4 py-3 font-semibold">Photos</th>
                            <th className="text-right px-4 py-3 font-semibold">Taille</th>
                            <th className="text-center px-4 py-3 font-semibold">Ventes</th>
                            <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Expire le</th>
                            <th className="text-left px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleActiveGalleries.map((g, i) => {
                            const key = galleryKey(g)
                            const isExpiringSoon = g.expiresAt && new Date(g.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                            const isSelected = selectedGalleries.has(key)
                            return (
                              <tr
                                key={key}
                                className={`transition-colors ${isSelected ? 'bg-action/10' : i % 2 === 0 ? 'bg-white' : 'bg-pale-blue/30'}`}
                              >
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      setSelectedGalleries((prev) => {
                                        const next = new Set(prev)
                                        if (e.target.checked) next.add(key)
                                        else next.delete(key)
                                        return next
                                      })
                                    }}
                                    className="cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-3 font-semibold text-navy">
                                  <button
                                    onClick={() => window.open(`/admin/photographe/${g.location}/${g.date}/${g.envol}`, '_blank')}
                                    className="hover:text-action hover:underline transition-colors text-left"
                                  >
                                    {formatDateShort(g.date)} · Env. {g.envol} ↗
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-mid">{SUCCURSALES[g.location] ?? g.location}</td>
                                <td className="px-4 py-3 text-mid text-center">{g.photoCount}</td>
                                <td className="px-4 py-3 text-mid text-right">{formatBytes(g.storageBytes)}</td>
                                <td className="px-4 py-3 text-mid text-center">{g.salesCount}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm ${isExpiringSoon ? 'text-amber-600 font-semibold' : 'text-mid'}`}>
                                  {g.expiresAt ? formatDateTime(g.expiresAt) : '—'}
                                  {isExpiringSoon && <span className="ml-1 text-xs">⚠️</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2 flex-wrap">
                                    <button
                                      onClick={() => extendGallery(g)}
                                      disabled={actionLoading === key + '-extend'}
                                      className="text-xs font-semibold bg-pale-blue text-navy px-3 py-1.5 rounded-lg hover:bg-action hover:text-white transition-colors disabled:opacity-40 whitespace-nowrap"
                                    >
                                      {actionLoading === key + '-extend' ? '...' : 'Prolonger'}
                                    </button>
                                    <button
                                      onClick={() => deactivateGallery(g)}
                                      disabled={actionLoading === key + '-deactivate'}
                                      className="text-xs font-semibold bg-pale-blue text-mid px-3 py-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                                    >
                                      {actionLoading === key + '-deactivate' ? '...' : 'Désactiver'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-mid">{Math.min(activeVisibleCount, filteredActiveGalleries.length)} / {filteredActiveGalleries.length} galeries</p>
                      <div className="flex gap-3">
                        {filteredActiveGalleries.length > activeVisibleCount && (
                          <button
                            onClick={() => setActiveVisibleCount((n) => n + 15)}
                            className="text-xs font-semibold text-action hover:underline"
                          >
                            Voir plus ({filteredActiveGalleries.length - activeVisibleCount} restantes)
                          </button>
                        )}
                        {activeVisibleCount > 15 && (
                          <button
                            onClick={() => setActiveVisibleCount(15)}
                            className="text-xs font-semibold text-mid hover:text-navy hover:underline"
                          >
                            Voir moins
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </section>

              {/* Section C — Expired */}
              <section>
                <h2 className="text-lg font-bold text-navy mb-4">
                  Galeries expirées
                  {expiredGalleries.length > 0 && (
                    <span className="ml-2 text-sm font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      {expiredGalleries.length}
                    </span>
                  )}
                </h2>

                {expiredGalleries.length === 0 ? (
                  <div className="text-center py-8 bg-pale-blue/50 rounded-xl text-mid text-sm">
                    Aucune galerie expirée.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-pale-blue">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-pale-blue text-navy">
                          <th className="text-left px-4 py-3 font-semibold">Galerie</th>
                          <th className="text-left px-4 py-3 font-semibold">Succursale</th>
                          <th className="text-center px-4 py-3 font-semibold">Photos</th>
                          <th className="text-right px-4 py-3 font-semibold">Taille</th>
                          <th className="text-center px-4 py-3 font-semibold">Ventes</th>
                          <th className="text-left px-4 py-3 font-semibold">Expirée le</th>
                          <th className="text-left px-4 py-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expiredGalleries.map((g, i) => {
                          const key = galleryKey(g)
                          return (
                            <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-pale-blue/30'}>
                              <td className="px-4 py-3 font-semibold text-navy">
                                {formatDateShort(g.date)} · Env. {g.envol}
                              </td>
                              <td className="px-4 py-3 text-mid">{SUCCURSALES[g.location] ?? g.location}</td>
                              <td className="px-4 py-3 text-mid text-center">{g.photoCount}</td>
                              <td className="px-4 py-3 text-mid text-right">{formatBytes(g.storageBytes)}</td>
                              <td className="px-4 py-3 text-mid text-center">{g.salesCount}</td>
                              <td className="px-4 py-3 text-mid whitespace-nowrap">
                                {g.expiresAt ? formatDateTime(g.expiresAt) : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => deleteGallery(g)}
                                  disabled={actionLoading === key + '-delete'}
                                  className="text-xs font-semibold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40 whitespace-nowrap"
                                >
                                  {actionLoading === key + '-delete' ? '...' : '🗑 Supprimer de R2'}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <button
                onClick={() => loadGalleries(managerPassword)}
                className="mt-6 text-sm text-mid hover:text-navy transition-colors"
              >
                ↻ Actualiser
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Composants ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? 'bg-amber-50 border-amber-200' : 'bg-white border-pale-blue'}`}>
      <p className="text-sm text-mid mb-1">{label}</p>
      <p className="text-2xl font-bold text-navy">{value}</p>
      {sub && <p className="text-sm text-mid mt-0.5">{sub}</p>}
    </div>
  )
}

function TokenStatusBadge({ status }: { status: TokenStatus }) {
  if (status === 'active') {
    return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full whitespace-nowrap">🟢 Actif</span>
  }
  if (status === 'expired') {
    return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">⚪ Expiré</span>
  }
  return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full whitespace-nowrap">🔴 Archivé</span>
}

function PendingColumn({
  title,
  galleries,
  actionLoading,
  onApprove,
  onEdit,
}: {
  title: string
  galleries: Gallery[]
  actionLoading: string | null
  onApprove: (g: Gallery) => void
  onEdit: (g: Gallery) => void
}) {
  function galleryKey(g: Gallery) {
    return `${g.location}/${g.date}/${g.envol}`
  }

  function formatDateShort(isoStr: string): string {
    if (!isoStr) return '—'
    const d = isoStr.includes('T') ? new Date(isoStr) : new Date(isoStr + 'T12:00:00')
    return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <h3 className="text-base font-bold text-navy mb-3">{title}</h3>
      {galleries.length === 0 ? (
        <div className="text-center py-6 bg-pale-blue/40 rounded-xl text-mid text-xs">
          Aucune galerie.
        </div>
      ) : (
        <div className="space-y-3">
          {galleries.map((g) => {
            const key = galleryKey(g)
            return (
              <div key={key} className="bg-white border border-pale-blue rounded-xl p-4">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div>
                    <p className="font-semibold text-navy">Envolée {g.envol} · {g.photoCount} photo{g.photoCount !== 1 ? 's' : ''}</p>
                    <p className="text-sm text-mid">{formatDateShort(g.date)}</p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                    ⏳ Pending
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onEdit(g)}
                    className="text-xs font-semibold bg-pale-blue text-navy px-3 py-1.5 rounded-lg hover:bg-action hover:text-white transition-colors whitespace-nowrap"
                  >
                    Modifier / Prévisualiser
                  </button>
                  <button
                    onClick={() => onApprove(g)}
                    disabled={actionLoading === key}
                    className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {actionLoading === key ? '...' : '✓ Approuver et publier'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Éditeur de galerie (Section A — mode édition) ─────────────────────────────

function GalleryEditor({
  gallery,
  managerPassword,
  onBack,
  onApprove,
}: {
  gallery: Gallery
  managerPassword: string
  onBack: () => void
  onApprove: () => Promise<void>
}) {
  interface Photo { id: string; url: string; filename: string }
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<{ file: File; status: 'pending' | 'uploading' | 'done' | 'error' }[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const SUCCURSALES: Record<string, string> = { 'rive-sud': 'Rive-Sud', 'rive-nord': 'Rive-Nord' }

  function formatDateShort(isoStr: string): string {
    const d = isoStr.includes('T') ? new Date(isoStr) : new Date(isoStr + 'T12:00:00')
    return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  async function loadPhotos() {
    setLoading(true)
    const res = await fetch(
      `/api/admin/photos?location=${gallery.location}&date=${gallery.date}&envol=${gallery.envol}`,
      { headers: { 'x-manager-password': managerPassword } }
    )
    setLoading(false)
    if (res.ok) {
      const data = await res.json()
      setPhotos(data.photos ?? [])
    }
  }

  useEffect(() => { loadPhotos() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(filename: string) {
    if (!confirm(`Supprimer "${filename}" définitivement ?`)) return
    setDeleting(filename)
    const res = await fetch('/api/admin/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-manager-password': managerPassword },
      body: JSON.stringify({ location: gallery.location, date: gallery.date, envol: gallery.envol, filename }),
    })
    setDeleting(null)
    if (res.ok) setPhotos((prev) => prev.filter((p) => p.filename !== filename))
  }

  function addFiles(files: FileList | null) {
    if (!files) return
    const images = Array.from(files).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
    setUploadFiles((prev) => [...prev, ...images.map((f) => ({ file: f, status: 'pending' as const }))])
  }

  async function createWebVersion(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const logo = new Image()
      img.onload = () => {
        const MAX = 1920
        const scale = Math.min(1, MAX / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        logo.onload = () => {
          const ls = Math.min((w * 0.8) / logo.width, (h * 0.8) / logo.height)
          const lw = logo.width * ls; const lh = logo.height * ls
          ctx.globalAlpha = 0.55
          ctx.drawImage(logo, (w - lw) / 2, (h - lh) / 2, lw, lh)
          ctx.globalAlpha = 1
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', 0.88)
        }
        logo.onerror = () => reject(new Error('Logo introuvable'))
        logo.src = '/watermark.png'
      }
      img.onerror = () => reject(new Error('Image invalide'))
      img.src = URL.createObjectURL(file)
    })
  }

  async function uploadAll() {
    setUploading(true)
    const pending = uploadFiles.map((f, i) => ({ ...f, idx: i })).filter((f) => f.status === 'pending')
    for (const item of pending) {
      setUploadFiles((prev) => prev.map((f, i) => i === item.idx ? { ...f, status: 'uploading' } : f))
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': managerPassword },
          body: JSON.stringify({ location: gallery.location, date: gallery.date, envol: gallery.envol, filename: item.file.name }),
        })
        if (!res.ok) throw new Error('Erreur API')
        const { webUrl, originalUrl } = await res.json()
        const webBlob = await createWebVersion(item.file)
        const [webRes, origRes] = await Promise.all([
          fetch(webUrl, { method: 'PUT', body: webBlob, headers: { 'Content-Type': 'image/jpeg' } }),
          fetch(originalUrl, { method: 'PUT', body: item.file, headers: { 'Content-Type': item.file.type || 'image/jpeg' } }),
        ])
        if (!webRes.ok || !origRes.ok) throw new Error('Erreur R2')
        setUploadFiles((prev) => prev.map((f, i) => i === item.idx ? { ...f, status: 'done' } : f))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue'
        setUploadFiles((prev) => prev.map((f, i) => i === item.idx ? { ...f, status: 'error', error: msg } : f))
      }
    }
    setUploading(false)
    await loadPhotos()
  }

  async function handleApprove() {
    setApproving(true)
    await onApprove()
    setApproving(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <button onClick={onBack} className="text-sm text-mid hover:text-action mb-2 inline-block transition-colors">
            ← Retour
          </button>
          <h1 className="text-2xl font-bold text-navy">
            Envolée {gallery.envol} — {SUCCURSALES[gallery.location] ?? gallery.location}
          </h1>
          <p className="text-mid text-sm mt-1">{formatDateShort(gallery.date)} · {photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">⏳ Pending</span>
          <button
            onClick={handleApprove}
            disabled={approving || photos.length === 0}
            className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {approving ? 'En cours...' : '✓ Approuver et publier'}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">
        ⏳ En attente — les clients ne voient pas encore ces photos.
      </div>

      {/* Grille de photos */}
      {loading ? (
        <div className="text-center py-12 text-mid">Chargement des photos...</div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 bg-pale-blue rounded-2xl text-mid mb-6">
          Aucune photo dans cette envolée. Ajoutez-en ci-dessous.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`relative group rounded-xl overflow-hidden bg-pale-blue aspect-square transition-opacity ${
                deleting === photo.filename ? 'opacity-30' : 'opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/20 transition-colors" />
              <button
                onClick={() => handleDelete(photo.filename)}
                disabled={deleting === photo.filename}
                className="absolute top-2 right-2 bg-red-600 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow"
                title="Supprimer"
              >
                ✕
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-navy/70 text-white text-xs px-2 py-1 translate-y-full group-hover:translate-y-0 transition-transform truncate">
                {photo.filename}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone d'upload */}
      <div className="border-2 border-dashed border-action/30 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-navy mb-4">Ajouter des photos</h2>
        <div
          className="border-2 border-dashed border-pale-blue rounded-xl p-8 text-center cursor-pointer hover:border-action transition-colors mb-4"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
        >
          <p className="text-mid text-sm">
            Glissez des photos ou{' '}
            <span className="text-action font-medium">cliquez pour sélectionner</span>
          </p>
          <p className="text-xs text-mid mt-1">JPG, PNG, WebP · Watermark appliqué automatiquement</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {uploadFiles.length > 0 && (
          <>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {uploadFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-pale-blue rounded-lg px-4 py-2">
                  <span className="text-sm text-navy truncate flex-1 mr-2">{f.file.name}</span>
                  <span className={`text-xs font-semibold ${
                    f.status === 'done' ? 'text-green-600'
                    : f.status === 'error' ? 'text-red-500'
                    : f.status === 'uploading' ? 'text-action'
                    : 'text-mid'
                  }`}>
                    {f.status === 'done' ? '✓ Envoyée'
                    : f.status === 'error' ? '✗ Erreur'
                    : f.status === 'uploading' ? 'Traitement...'
                    : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
            {uploadFiles.some((f) => f.status === 'pending') && !uploading && (
              <button onClick={uploadAll} className="btn-primary w-full">
                Envoyer {uploadFiles.filter((f) => f.status === 'pending').length} photo{uploadFiles.filter((f) => f.status === 'pending').length > 1 ? 's' : ''} →
              </button>
            )}
            {uploading && <p className="text-action text-sm text-center">Envoi en cours...</p>}
            {uploadFiles.every((f) => f.status === 'done') && (
              <button onClick={() => setUploadFiles([])} className="btn-secondary w-full text-sm">
                Prêt pour d&apos;autres photos
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Modal photos achetées ──────────────────────────────────────────────────────

function PhotoPopupModal({
  sale,
  photos,
  loading,
  onClose,
}: {
  sale: Sale
  photos: { id: string; url: string; filename: string }[]
  loading: boolean
  onClose: () => void
}) {
  const SUCCURSALES: Record<string, string> = { 'rive-sud': 'Rive-Sud', 'rive-nord': 'Rive-Nord' }

  function formatDateShort(isoStr: string): string {
    if (!isoStr) return '—'
    const d = isoStr.includes('T') ? new Date(isoStr) : new Date(isoStr + 'T12:00:00')
    return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pale-blue shrink-0">
          <div>
            <p className="text-sm font-bold text-navy">{sale.customerName ?? '—'}</p>
            <p className="text-xs text-mid">
              {SUCCURSALES[sale.location] ?? sale.location} · {formatDateShort(sale.date)} · Env. {sale.envol}
              {sale.customerEmail && <span className="ml-2">· {sale.customerEmail}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-mid hover:text-navy text-xl leading-none px-2"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <p className="text-center text-mid py-12">Chargement des photos...</p>
          ) : photos.length === 0 ? (
            <p className="text-center text-mid py-12 text-sm">Aucune photo trouvée pour cette galerie.</p>
          ) : (
            <>
              <p className="text-xs text-mid mb-4">{photos.length} photo{photos.length > 1 ? 's' : ''}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="rounded-xl overflow-hidden bg-pale-blue">
                    <p className="text-xs font-mono text-mid px-2 pt-2 pb-1 truncate">
                      {photo.filename.replace(/\.[^.]+$/, '')}
                    </p>
                    <div className="aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
