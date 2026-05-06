import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { stripe } from '@/lib/stripe'
import {
  listAllGalleries,
  getDownloadToken,
  setGalleryMetadata,
  purgeGalleryKeepPurchased,
} from '@/lib/r2'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!

// Vérifie si un token de téléchargement actif existe pour une galerie donnée
async function hasActiveToken(location: string, date: string, envol: string): Promise<boolean> {
  const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: 'tokens/' })
  const response = await r2.send(command)
  const tokenObjects = response.Contents ?? []

  const now = new Date()

  for (const obj of tokenObjects) {
    if (!obj.Key || !obj.Key.endsWith('.json')) continue

    try {
      const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: obj.Key }))
      const body = await res.Body?.transformToString()
      if (!body) continue

      const token = JSON.parse(body)

      const matchesGallery =
        token.location === location &&
        token.date === date &&
        token.envol === envol

      const isActive = new Date(token.expiresAt) > now

      if (matchesGallery && isActive) return true
    } catch {
      // token illisible — on ignore
    }
  }

  return false
}

export async function GET(req: NextRequest) {
  // Vérification du secret (Vercel envoie automatiquement ce header)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const now = new Date()
  const results = {
    checked: 0,
    skipped_active_token: 0,
    purged: 0,
    errors: 0,
  }

  try {
    const galleries = await listAllGalleries()
    const expired = galleries.filter(
      (g) => g.status === 'active' && g.expiresAt && new Date(g.expiresAt) < now
    )

    results.checked = expired.length

    for (const gallery of expired) {
      const { location, date, envol } = gallery

      try {
        // Si un lien de téléchargement est encore actif → on attend
        const activeToken = await hasActiveToken(location, date, envol)
        if (activeToken) {
          results.skipped_active_token++
          continue
        }

        // Trouver les photos achetées via Stripe (pour garder leurs versions web)
        const sessions = await stripe.checkout.sessions.list({ status: 'complete', limit: 100 })
        const gallerySessions = sessions.data.filter(
          (s) =>
            s.metadata?.location === location &&
            s.metadata?.date === date &&
            s.metadata?.envol === envol
        )

        const purchasedWebKeys = new Set<string>()
        await Promise.all(
          gallerySessions.map(async (session) => {
            const downloadToken = session.metadata?.downloadToken
            if (!downloadToken) return
            const tokenData = await getDownloadToken(downloadToken)
            if (!tokenData) return
            for (const originalKey of tokenData.photoIds) {
              const webKey = originalKey.replace('/originals/', '/web/')
              purchasedWebKeys.add(webKey)
            }
          })
        )

        // Purger — garde .gallery.json + versions web des photos achetées
        await purgeGalleryKeepPurchased(location, date, envol, purchasedWebKeys)

        // Marquer comme archivée
        await setGalleryMetadata(location, date, envol, {
          ...(gallery as any),
          status: 'archived',
        })

        results.purged++
      } catch (err) {
        console.error(`Erreur purge galerie ${location}/${date}/${envol}:`, err)
        results.errors++
      }
    }

    console.log('[cron/expire-galleries]', results)
    return NextResponse.json({ success: true, ...results })
  } catch (err) {
    console.error('[cron/expire-galleries] Erreur générale:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
