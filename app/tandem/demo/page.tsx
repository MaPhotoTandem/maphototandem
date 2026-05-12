import GalleryClient from '@/components/GalleryClient'
import { FIRST_PHOTO_PRICE_CENTS, ADDITIONAL_PHOTO_PRICE_CENTS } from '@/lib/pricing'

// Photos de démonstration — images réelles depuis picsum.photos
const DEMO_PHOTOS = [
  { id: 'demo/1', url: 'https://picsum.photos/seed/sky1/1200/800',   filename: 'photo_001.jpg' },
  { id: 'demo/2', url: 'https://picsum.photos/seed/jump2/1200/800',  filename: 'photo_002.jpg' },
  { id: 'demo/3', url: 'https://picsum.photos/seed/fall3/1200/800',  filename: 'photo_003.jpg' },
  { id: 'demo/4', url: 'https://picsum.photos/seed/wind4/1200/800',  filename: 'photo_004.jpg' },
  { id: 'demo/5', url: 'https://picsum.photos/seed/blue5/1200/800',  filename: 'photo_005.jpg' },
  { id: 'demo/6', url: 'https://picsum.photos/seed/air6/1200/800',   filename: 'photo_006.jpg' },
  { id: 'demo/7', url: 'https://picsum.photos/seed/cloud7/1200/800', filename: 'photo_007.jpg' },
  { id: 'demo/8', url: 'https://picsum.photos/seed/dive8/1200/800',  filename: 'photo_008.jpg' },
  { id: 'demo/9', url: 'https://picsum.photos/seed/free9/1200/800',  filename: 'photo_009.jpg' },
  { id: 'demo/10',url: 'https://picsum.photos/seed/chute10/1200/800',filename: 'photo_010.jpg' },
]

export default function DemoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Bannière démo */}
      <div className="bg-gris-pale border border-rouge/30 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
        <span className="text-rouge font-bold text-sm">MODE DÉMO</span>
        <span className="text-gray-600 text-sm">
          Photos fictives · Le paiement ne sera pas traité
        </span>
      </div>

      {/* En-tête identique à la vraie galerie */}
      <div className="mb-8">
        <a href="/tandem" className="text-sm text-gris-mid hover:text-rouge transition-colors mb-4 inline-block">
          ← Retour
        </a>
        <h1 className="text-2xl font-bold text-noir">
          Envolée 3 — 11 avril 2026
        </h1>
        <p className="text-gris-mid mt-1">
          Rive-Sud · Farnham · Sélectionnez les photos que vous souhaitez acheter.
        </p>
        <div className="mt-3 inline-flex flex-wrap gap-3">
          <span className="bg-gris-pale text-noir text-sm font-semibold px-3 py-1.5 rounded-lg">
            1re photo : {(FIRST_PHOTO_PRICE_CENTS / 100).toFixed(0)} $
          </span>
          <span className="bg-gris-pale text-noir text-sm font-semibold px-3 py-1.5 rounded-lg">
            Photos supplémentaires : {(ADDITIONAL_PHOTO_PRICE_CENTS / 100).toFixed(0)} $ chacune
          </span>
          <span className="bg-gray-100 text-gris-mid text-sm px-3 py-1.5 rounded-lg">
            + TPS &amp; TVQ
          </span>
        </div>
      </div>

      {/* Vraie galerie interactive */}
      <GalleryClient
        photos={DEMO_PHOTOS}
        date="2026-04-11"
        envol="3"
        location="rive-sud"
      />
    </div>
  )
}
