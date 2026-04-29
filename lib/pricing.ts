// Tarification Ma Photo Tandem
// Première photo : 49 $ + taxes
// Photos supplémentaires : 10 $ chacune + taxes
// TPS (5%) + TVQ (9,975%) = 14,975 %

export const FIRST_PHOTO_PRICE_CENTS       = 4900   // 49,00 $
export const ADDITIONAL_PHOTO_PRICE_CENTS  = 1000   // 10,00 $
export const TAX_RATE                      = 0.14975 // TPS 5% + TVQ 9,975%

/** Sous-total avant taxes selon le nombre de photos */
export function calculateSubtotal(count: number): number {
  if (count <= 0) return 0
  return FIRST_PHOTO_PRICE_CENTS + Math.max(0, count - 1) * ADDITIONAL_PHOTO_PRICE_CENTS
}

/** Montant des taxes (arrondi au cent) */
export function calculateTax(subtotalCents: number): number {
  return Math.round(subtotalCents * TAX_RATE)
}

/** Total taxes incluses */
export function calculateTotal(count: number): number {
  const subtotal = calculateSubtotal(count)
  return subtotal + calculateTax(subtotal)
}

/** Prix affiché sur la vignette d'une photo selon la sélection en cours */
export function photoBadgePrice(selectedCount: number): string {
  return selectedCount === 0 ? '49$ la première, 10$ ensuite' : '+10 $'
}
