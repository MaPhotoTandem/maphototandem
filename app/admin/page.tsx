// Cette page n'est jamais affichée — le middleware redirige /admin vers /
// Conservée pour éviter une erreur 404 si Next.js cherche le fichier.
export default function AdminPage() {
  return null
}
