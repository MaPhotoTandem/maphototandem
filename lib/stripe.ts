import Stripe from 'stripe'

// Client Stripe — utilisé côté serveur uniquement
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})
