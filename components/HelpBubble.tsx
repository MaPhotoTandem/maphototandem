'use client'

import { useState } from 'react'

export default function HelpBubble() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="relative z-40 bg-white rounded-2xl shadow-xl overflow-hidden w-52 border border-gray-100">
            <a
              href="/tandem"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-noir hover:bg-gris-pale transition-colors"
            >
              <span>🔍</span> Retrouver mon envolée
            </a>
            <div className="border-t border-gray-100" />
            <a
              href="/faq"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-noir hover:bg-gris-pale transition-colors"
            >
              <span>❓</span> Questions fréquentes
            </a>
            <div className="border-t border-gray-100" />
            <a
              href="/contact"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-noir hover:bg-gris-pale transition-colors"
            >
              <span>✉️</span> Contactez-nous
            </a>
          </div>
        </>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="bg-rouge text-white rounded-full shadow-lg px-4 py-3 text-sm font-semibold flex items-center gap-2 hover:bg-rouge/90 transition-colors"
        aria-label="Besoin d'aide ?"
      >
        <span>💬</span>
        <span className="hidden sm:inline">Besoin d&apos;aide ?</span>
      </button>
    </div>
  )
}
