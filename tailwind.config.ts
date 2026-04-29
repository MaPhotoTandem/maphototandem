import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:      '#001F3F', // En-têtes, nav, sections principales
        action:    '#0066CC', // Boutons CTA, liens actifs, accents
        'pale-blue': '#E6F0FF', // Fond cartes accentuées
        mid:       '#999999', // Texte secondaire
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
