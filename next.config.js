/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirections — gardent les anciennes URLs fonctionnelles après restructure
  async redirects() {
    return [
      // Racine → site tandem (temporaire, jusqu'à ce qu'une vraie page d'accueil existe)
      { source: '/', destination: '/tandem', permanent: false },
      // Anciennes URLs clients (avant restructure /tandem) → nouvelles URLs
      { source: '/galerie/:path*', destination: '/tandem/galerie/:path*', permanent: true },
      { source: '/download/:path*', destination: '/tandem/download/:path*', permanent: true },
      { source: '/success', destination: '/tandem/success', permanent: true },
      { source: '/demo', destination: '/tandem/demo', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      {
        // Cloudflare R2 (accès direct via presigned URLs)
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        // Cloudflare R2 (domaine r2.dev public)
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        // Domaine personnalisé R2
        protocol: 'https',
        hostname: process.env.R2_PUBLIC_URL
          ? new URL(process.env.R2_PUBLIC_URL).hostname
          : 'localhost',
      },
      {
        // Photos de démonstration
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
}

module.exports = nextConfig
