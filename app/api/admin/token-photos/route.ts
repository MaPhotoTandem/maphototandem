// Retourne les photos watermarquées achetées pour un token donné
import { NextRequest, NextResponse } from 'next/server'
import { getDownloadToken } from '@/lib/r2'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function authManager(req: NextRequest) {
  return req.headers.get('x-manager-password') === process.env.MANAGER_PASSWORD
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!

export async function GET(req: NextRequest) {
  if (!authManager(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const downloadToken = searchParams.get('downloadToken')

  if (!downloadToken) {
    return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
  }

  try {
    const tokenData = await getDownloadToken(downloadToken)
    if (!tokenData) {
      return NextResponse.json({ error: 'Token introuvable.' }, { status: 404 })
    }

    // photoIds = clés R2 vers les originaux (ex: rive-sud/2026-04-11/3/originals/DSC_001.jpg)
    // On dérive la clé watermarquée en remplaçant /originals/ par /web/
    const photos = await Promise.all(
      tokenData.photoIds.map(async (originalKey) => {
        const webKey = originalKey.replace('/originals/', '/web/')
        const filename = webKey.split('/').pop() ?? webKey

        const signedUrl = await getSignedUrl(
          r2,
          new GetObjectCommand({ Bucket: BUCKET, Key: webKey }),
          { expiresIn: 7200 } // 2 heures
        )

        return { id: originalKey, url: signedUrl, filename }
      })
    )

    return NextResponse.json({ photos, count: photos.length })
  } catch (err) {
    console.error('[token-photos] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
