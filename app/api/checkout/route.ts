import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { calculateSubtotal, calculateTax } from '@/lib/pricing'
import { randomUUID } from 'crypto'

const SUCCURSALES: Record<string, string> = {
  'rive-sud':  'Rive-Sud · Farnham',
  'rive-nord': 'Rive-Nord · St-Esprit',
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { photoIds, location, date, envol, email } = body as {
    photoIds: string[]
    location: string
    date: string
    envol: string
    email: string
  }

  if (!photoIds?.length || !location || !date || !envol) {
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const succursaleLabel = SUCCURSALES[location] ?? location
  const downloadToken = randomUUID()

  // Calcul du prix : 49$ première photo + 10$ par photo supplémentaire
  const subtotalCents = calculateSubtotal(photoIds.length)
  const taxCents      = calculateTax(subtotalCents)

  const photoLabel = photoIds.length === 1
    ? '1 photo en haute résolution'
    : `${photoIds.length} photos en haute résolution · 49 $ (1re) + ${photoIds.length - 1} × 10 $`

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      locale: 'fr-CA',
      customer_email: body.email,
      line_items: [
        // Sous-total photos
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Photos — Envolée ${envol} du ${date}`,
              description: `${succursaleLabel} · ${photoLabel}`,
            },
            unit_amount: subtotalCents,
          },
          quantity: 1,
        },
        // Taxes (TPS 5% + TVQ 9,975%)
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: 'Taxes (TPS 5 % + TVQ 9,975 %)',
            },
            unit_amount: taxCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        photoIds: JSON.stringify(photoIds),
        location,
        date,
        envol,
        downloadToken,
      },
      success_url: `${baseUrl}/tandem/download/${downloadToken}`,
      cancel_url:  `${baseUrl}/tandem/galerie/${location}/${date}/${envol}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Erreur Stripe checkout:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement.' },
      { status: 500 }
    )
  }
}
