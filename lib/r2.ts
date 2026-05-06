// Client Cloudflare R2 — compatible avec l'API AWS S3
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// ── Métadonnées de galerie (.gallery.json par envolée) ────────────────────────
export type GalleryStatus = 'pending' | 'active' | 'expired' | 'archived'

export interface GalleryMetadata {
  status: GalleryStatus
  location: string
  date: string
  envol: string
  activatedAt?: string    // ISO — quand approuvée
  expiresAt?: string      // ISO — activatedAt + 30j (mis à jour si prolongée)
  passengers?: string[]   // Prénoms des sauteurs (ex: ["Sabrina", "Jean", "Mathieu"])
}

// ── Structure du token de téléchargement (sauvegardé dans R2 sous tokens/{token}.json) ──
export interface DownloadToken {
  photoIds: string[]
  email: string | null
  location: string
  date: string
  envol: string
  amount: number       // en cents
  createdAt: string    // ISO 8601
  expiresAt: string    // ISO 8601 — 72h après createdAt
}

// Initialisation du client R2
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!

/**
 * Structure des fichiers dans R2 :
 *   {location}/{date}/{envol}/web/{filename}.jpg   → version watermarquée (galerie)
 *   {location}/{date}/{envol}/originals/{filename} → version originale (téléchargement)
 *
 * location = "rive-sud" ou "rive-nord"
 * Ex: "rive-sud/2026-04-11/3/originals/DSC_001.jpg"
 */

/**
 * Liste les photos watermarquées d'une envolée (pour la galerie).
 */
export async function listPhotos(location: string, date: string, envol: string) {
  const prefix = `${location}/${date}/${envol}/web/`

  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
  })

  const response = await r2.send(command)
  const objects = response.Contents ?? []

  const photos = await Promise.all(
    objects
      .filter((obj) => obj.Key && isImageFile(obj.Key))
      .map(async (obj) => {
        // URL signée pour affichage galerie (valide 2 heures)
        const signedUrl = await getSignedUrl(
          r2,
          new GetObjectCommand({ Bucket: BUCKET, Key: obj.Key! }),
          { expiresIn: 7200 }
        )

        const filename = obj.Key!.split('/').pop() ?? obj.Key!

        // L'ID pointe vers l'original (pour le téléchargement après achat)
        const originalKey = `${location}/${date}/${envol}/originals/${filename}`

        return {
          id: originalKey,
          url: signedUrl,
          filename,
          size: obj.Size,
        }
      })
  )

  return photos
}

/**
 * Génère deux URLs présignées pour uploader une photo (utilisées par l'admin) :
 * - webUrl    → pour la version watermarquée/redimensionnée (galerie)
 * - originalUrl → pour la version originale haute résolution (téléchargement)
 * Expire après 15 minutes.
 */
export async function getUploadUrls(location: string, date: string, envol: string, filename: string) {
  const webKey = `${location}/${date}/${envol}/web/${filename}`
  const originalKey = `${location}/${date}/${envol}/originals/${filename}`

  const [webUrl, originalUrl] = await Promise.all([
    getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: webKey,
        ContentType: 'image/jpeg',
      }),
      { expiresIn: 900 }
    ),
    getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: originalKey,
        ContentType: getContentType(filename),
      }),
      { expiresIn: 900 }
    ),
  ])

  return { webUrl, originalUrl, webKey, originalKey }
}

/**
 * Génère des URLs de téléchargement pour les originaux achetés.
 * Expire après 4 heures (les URLs sont régénérées à chaque chargement de page).
 */
export async function getDownloadUrls(photoIds: string[]) {
  const urls = await Promise.all(
    photoIds.map(async (id) => {
      const signedUrl = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: BUCKET,
          Key: id,
          ResponseContentDisposition: `attachment; filename="${id.split('/').pop()}"`,
        }),
        { expiresIn: 14400 } // 4 heures — régénérées à chaque chargement de page
      )
      return { id, downloadUrl: signedUrl, filename: id.split('/').pop() ?? id }
    })
  )
  return urls
}

/**
 * Sauvegarde un token de téléchargement dans R2.
 * Clé : tokens/{token}.json
 */
export async function saveDownloadToken(token: string, data: DownloadToken): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `tokens/${token}.json`,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    })
  )
}

/**
 * Lit un token de téléchargement depuis R2.
 * Retourne null si le token n'existe pas.
 */
export async function getDownloadToken(token: string): Promise<DownloadToken | null> {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: `tokens/${token}.json` })
    const response = await r2.send(command)
    const body = await response.Body?.transformToString()
    if (!body) return null
    return JSON.parse(body) as DownloadToken
  } catch {
    return null
  }
}

/**
 * Liste les envolées qui ont des photos pour une succursale et une date données.
 * Retourne uniquement les envolées réelles (avec au moins une photo uploadée).
 */
export async function listFlights(location: string, date: string) {
  const prefix = `${location}/${date}/`
  const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  const response = await r2.send(command)
  const objects = response.Contents ?? []

  // Trouver les envolées uniques qui ont des photos dans /web/
  const flightSet = new Set<string>()
  for (const obj of objects) {
    if (!obj.Key) continue
    const parts = obj.Key.split('/')
    // Structure: location/date/envol/web/filename
    if (parts.length >= 5 && parts[3] === 'web' && isImageFile(obj.Key)) {
      flightSet.add(parts[2])
    }
  }

  // Pour chaque envolée : compter les photos + vérifier si publiée
  const flights = Array.from(flightSet)
    .sort((a, b) => Number(a) - Number(b))
    .map((envol) => {
      const photoCount = objects.filter(
        (obj) =>
          obj.Key?.startsWith(`${location}/${date}/${envol}/web/`) &&
          obj.Key && isImageFile(obj.Key)
      ).length
      const published = objects.some(
        (obj) => obj.Key === `${location}/${date}/${envol}/.published`
      )
      return { envol, photoCount, published }
    })

  return flights
}

/**
 * Supprime une photo (version web + original) d'une envolée.
 */
export async function deletePhoto(
  location: string,
  date: string,
  envol: string,
  filename: string
) {
  const webKey = `${location}/${date}/${envol}/web/${filename}`
  const originalKey = `${location}/${date}/${envol}/originals/${filename}`

  await Promise.all([
    r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: webKey })),
    r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: originalKey })),
  ])
}

/**
 * Approuve ou retire l'approbation d'une envolée.
 * Un fichier .published dans le dossier de l'envolée = galerie visible par les clients.
 */
export async function setPublished(
  location: string,
  date: string,
  envol: string,
  published: boolean
) {
  const key = `${location}/${date}/${envol}/.published`
  if (published) {
    await r2.send(
      new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: '', ContentType: 'text/plain' })
    )
  } else {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  }
}

/**
 * Vérifie si une envolée est approuvée (visible par les clients).
 */
export async function isPublished(
  location: string,
  date: string,
  envol: string
): Promise<boolean> {
  try {
    await r2.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: `${location}/${date}/${envol}/.published` })
    )
    return true
  } catch {
    return false
  }
}

// ── Galerie : lecture / écriture .gallery.json ────────────────────────────────

const galleryMetaKey = (location: string, date: string, envol: string) =>
  `${location}/${date}/${envol}/.gallery.json`

export async function getGalleryMetadata(
  location: string,
  date: string,
  envol: string
): Promise<GalleryMetadata | null> {
  try {
    const res = await r2.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: galleryMetaKey(location, date, envol) })
    )
    const body = await res.Body?.transformToString()
    if (!body) return null
    return JSON.parse(body) as GalleryMetadata
  } catch {
    return null
  }
}

export async function setGalleryMetadata(
  location: string,
  date: string,
  envol: string,
  data: GalleryMetadata
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: galleryMetaKey(location, date, envol),
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    })
  )
}

/**
 * Liste toutes les galeries de toutes les succursales et dates.
 * Retourne les métadonnées enrichies avec le nombre de photos et la taille.
 */
export async function listAllGalleries(): Promise<(GalleryMetadata & { photoCount: number; storageBytes: number })[]> {
  const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: '' })
  const response = await r2.send(command)
  const objects = response.Contents ?? []

  // Extraire les envolées uniques qui ont des photos
  const gallerySet = new Map<string, { photoCount: number; storageBytes: number }>()

  for (const obj of objects) {
    if (!obj.Key) continue
    const parts = obj.Key.split('/')
    // Structure: location/date/envol/web/filename
    if (parts.length >= 5 && parts[3] === 'web' && isImageFile(obj.Key)) {
      const key = `${parts[0]}/${parts[1]}/${parts[2]}`
      const existing = gallerySet.get(key) ?? { photoCount: 0, storageBytes: 0 }
      gallerySet.set(key, {
        photoCount: existing.photoCount + 1,
        storageBytes: existing.storageBytes + (obj.Size ?? 0),
      })
    }
  }

  // Charger les métadonnées pour chaque galerie
  const results = await Promise.all(
    Array.from(gallerySet.entries()).map(async ([key, stats]) => {
      const [location, date, envol] = key.split('/')
      let meta = await getGalleryMetadata(location, date, envol)

      // Si pas de .gallery.json → galerie uploadée avant la refonte → pending
      if (!meta) {
        const isPublishedFlag = objects.some(
          (obj) => obj.Key === `${location}/${date}/${envol}/.published`
        )
        meta = {
          status: isPublishedFlag ? 'active' : 'pending',
          location,
          date,
          envol,
        }
      }

      // Vérifier expiration automatique
      if (meta.status === 'active' && meta.expiresAt) {
        const now = new Date()
        if (new Date(meta.expiresAt) < now) {
          meta = { ...meta, status: 'expired' }
          await setGalleryMetadata(location, date, envol, meta)
        }
      }

      return { ...meta, ...stats }
    })
  )

  return results.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return Number(a.envol) - Number(b.envol)
  })
}

/**
 * Supprime toutes les images (web + originals) d'une envolée dans R2.
 * Conserve .gallery.json pour l'historique (statut archived).
 */
export async function purgeGallery(
  location: string,
  date: string,
  envol: string
): Promise<void> {
  const prefix = `${location}/${date}/${envol}/`
  const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  const response = await r2.send(command)
  const objects = response.Contents ?? []

  // Supprimer tout sauf .gallery.json
  await Promise.all(
    objects
      .filter((obj) => obj.Key && !obj.Key.endsWith('.gallery.json'))
      .map((obj) => r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: obj.Key! })))
  )
}

/**
 * Supprime toutes les images d'une envolée SAUF les versions web des photos achetées.
 * Conserve aussi .gallery.json pour le statut archived.
 * Utilisé lors de la suppression d'une galerie expirée.
 */
export async function purgeGalleryKeepPurchased(
  location: string,
  date: string,
  envol: string,
  keepWebKeys: Set<string>
): Promise<void> {
  const prefix = `${location}/${date}/${envol}/`
  const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  const response = await r2.send(command)
  const objects = response.Contents ?? []

  await Promise.all(
    objects
      .filter((obj) => {
        if (!obj.Key) return false
        if (obj.Key.endsWith('.gallery.json')) return false  // garder
        if (keepWebKeys.has(obj.Key)) return false           // garder (web achetée)
        return true                                          // supprimer
      })
      .map((obj) => r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: obj.Key! })))
  )
}

/**
 * Calcule le stockage total utilisé dans R2 (en octets).
 */
export async function getTotalStorageBytes(): Promise<number> {
  const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: '' })
  const response = await r2.send(command)
  const objects = response.Contents ?? []
  return objects.reduce((sum, obj) => sum + (obj.Size ?? 0), 0)
}

/**
 * Vérifie si un fichier existe dans R2 (HeadObject).
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

// Helpers
function isImageFile(key: string): boolean {
  return /\.(jpg|jpeg|png|webp)$/i.test(key)
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  }
  return types[ext ?? ''] ?? 'application/octet-stream'
}
