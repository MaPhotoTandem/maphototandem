// Endpoint ZIP — télécharge toutes les photos achetées dans une seule archive.
// GET /api/download-zip/[token]
import { NextRequest, NextResponse } from 'next/server'
import { getDownloadToken, getDownloadUrls } from '@/lib/r2'
import JSZip from 'jszip'

export const runtime = 'nodejs'
export const maxDuration = 60 // secondes — Vercel Pro

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params

  // 1. Valider le token
  const tokenData = await getDownloadToken(token)
  if (!tokenData) {
    return NextResponse.json({ error: 'Token invalide ou introuvable.' }, { status: 404 })
  }

  // 2. Vérifier l'expiration
  if (new Date(tokenData.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Ce lien a expiré.' }, { status: 410 })
  }

  // 3. Générer les URLs signées pour les originaux
  const downloads = await getDownloadUrls(tokenData.photoIds)

  // 4. Télécharger chaque photo et les ajouter au ZIP
  const zip = new JSZip()

  await Promise.all(
    downloads.map(async ({ downloadUrl, filename }) => {
      try {
        const res = await fetch(downloadUrl)
        if (!res.ok) throw new Error(`Erreur téléchargement: ${filename}`)
        const buffer = await res.arrayBuffer()
        zip.file(filename ?? 'photo.jpg', buffer)
      } catch (err) {
        console.error(`[download-zip] Erreur photo ${filename}:`, err)
        // On continue même si une photo échoue
      }
    })
  )

  // 5. Générer l'archive
  const zipBuffer = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'STORE', // Pas de compression — les JPEG sont déjà compressés
  })

  // 6. Retourner le ZIP
  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="photos-ma-photo-tandem.zip"`,
      'Cache-Control': 'no-store',
    },
  })
}
