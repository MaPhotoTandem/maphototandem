/** @type {import('next').NextConfig} */

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.r2.dev https://picsum.photos;
  connect-src 'self' https://api.stripe.com https://*.r2.cloudflarestorage.com https://*.r2.dev;
  frame-src https://js.stripe.com;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\n/g, ' ').trim()

// Note : mettre à jour script-src, connect-src et frame-src lors de l'intégration Clover

const securityHeaders = [
  { key: 'Content-Security-Policy',   value: ContentSecurityPolicy },
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

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
