import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ma Photo Tandem — Vos photos de saut',
  description: 'Retrouvez et achetez vos photos de saut en tandem chez Parachute Montréal.',
  // Viewport mobile — empêche le zoom automatique sur les inputs iOS
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  openGraph: {
    title: 'Ma Photo Tandem',
    description: 'Vos photos de saut en tandem — Parachute Montréal',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col bg-white">

        {/* Header navy — compact sur mobile */}
        <header className="bg-navy px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/watermark.png"
                alt="Ma Photo Tandem"
                className="h-10 sm:h-12 w-auto"
              />
            </a>
            <nav className="flex items-center gap-4 sm:gap-6">
              <a href="/faq" className="text-white font-bold text-xs sm:text-sm transition-colors hover:text-white/80">FAQ</a>
              <a href="/contact" className="text-white font-bold text-xs sm:text-sm transition-colors hover:text-white/80">Contact</a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-navy text-white/50 px-4 py-4 text-center text-xs sm:text-sm">
          © {new Date().getFullYear()} Ma Photo Tandem · Parachute Montréal
          {' · '}
          <a href="/faq" className="hover:text-white/80 underline transition-colors">FAQ</a>
          {' · '}
          <a href="/contact" className="hover:text-white/80 underline transition-colors">Contact</a>
          {' · '}
          <a href="/conditions" className="hover:text-white/80 underline transition-colors">Conditions</a>
          {' · '}
          <a href="/confidentialite" className="hover:text-white/80 underline transition-colors">Confidentialité</a>
        </footer>

      </body>
    </html>
  )
}
