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
        rouge:        '#D4252B', // CTA, boutons, accents principaux
        noir:         '#000000', // Titres, nav, texte principal
        'gris-pale':  '#F8F8F8', // Fond pages, cartes
        'gris-mid':   '#4A4A4A', // Texte secondaire
        'gris-bordure': '#E0E0E0', // Bordures, séparateurs
        'rouge-pale': '#FDECEA', // Fonds accentués légers
        // Anciens noms — garder le temps de migrer les composants
        navy:         '#000000',
        action:       '#D4252B',
        'pale-blue':  '#F8F8F8',
        mid:          '#4A4A4A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
