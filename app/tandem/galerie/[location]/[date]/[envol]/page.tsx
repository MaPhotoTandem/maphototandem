import { notFound } from 'next/navigation'
import { listPhotos, isPublished } from '@/lib/r2'
import { FIRST_PHOTO_PRICE_CENTS, ADDITIONAL_PHOTO_PRICE_CENTS } from '@/lib/pricing'
import GalleryClient from '@/components/GalleryClient'

interface Props {
  params: { location: string; date: string; envol: string }
}

const SUCCURSALES: Record<string, string> = {
  'rive-sud':  'Rive-Sud · Farnham',
  'rive-nord': 'Rive-Nord · St-Esprit',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('fr-CA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function GalleriePage({ params }: Props) {
  const { location, date, envol } = params

  const validLocations = ['rive-sud', 'rive-nord']
  if (
    !validLocations.includes(location) ||
    !date.match(/^\d{4}-\d{2}-\d{2}$/) ||
    !envol.match(/^\d+$/)
  ) {
    notFound()
  }

  // Vérifier si la galerie est approuvée par la gestionnaire
  let published = false
  try {
    published = await isPublished(location, date, envol)
  } catch {
    published = false
  }

  if (!published) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4 text-navy">Photos en cours de traitement</h1>
        <p className="text-mid mb-2">
          Les photos de l&apos;envolée <strong>{envol}</strong> du{' '}
          <strong>{formatDate(date)}</strong> ne sont pas encore disponibles.
        </p>
        <p className="text-mid text-sm mb-8">
          Elles sont généralement publiées en soirée. Revenez plus tard!
        </p>
        <a href="/tandem" className="btn-secondary">← Retour</a>
      </div>
    )
  }

  let photos
  try {
    photos = await listPhotos(location, date, envol)
  } catch {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500">Erreur de chargement. Réessayez plus tard.</p>
      </div>
    )
  }

  const succursaleLabel = SUCCURSALES[location]

  if (photos.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4 text-navy">Aucune photo trouvée</h1>
        <p className="text-mid mb-2">
          Aucune photo pour l&apos;envolée <strong>{envol}</strong> du{' '}
          <strong>{formatDate(date)}</strong> à {succursaleLabel}.
        </p>
        <p className="text-mid text-sm mb-8">
          Vérifiez la date et le numéro d&apos;envolée, ou revenez plus tard —
          les photos sont généralement disponibles en soirée.
        </p>
        <a href="/tandem" className="btn-secondary">← Retour</a>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href="/tandem" className="text-sm text-mid hover:text-action transition-colors mb-4 inline-block">
          ← Retour
        </a>
        <h1 className="text-2xl font-bold text-navy">
          Envolée {envol} — {formatDate(date)}
        </h1>
        <p className="text-mid mt-1">
          {succursaleLabel} · Sélectionnez les photos que vous souhaitez acheter.
        </p>
        <div className="mt-3 inline-flex flex-wrap gap-3">
          <span className="bg-pale-blue text-navy text-sm font-semibold px-3 py-1.5 rounded-lg">
            1re photo : {(FIRST_PHOTO_PRICE_CENTS / 100).toFixed(0)} $
          </span>
          <span className="bg-pale-blue text-navy text-sm font-semibold px-3 py-1.5 rounded-lg">
            Photos supplémentaires : {(ADDITIONAL_PHOTO_PRICE_CENTS / 100).toFixed(0)} $ chacune
          </span>
          <span className="bg-gray-100 text-mid text-sm px-3 py-1.5 rounded-lg">
            + TPS &amp; TVQ
          </span>
        </div>
      </div>

      <GalleryClient
        photos={photos}
        date={date}
        envol={envol}
        location={location}
      />
    </div>
  )
}
