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
        rouge:       '#D4252B', // CTA, boutons, accents principaux
        noir:        '#000000', // Titres, nav, texte principal
        'gris-chaud': '#F5F4F1', // Fond pages, cartes
        'gris-mid':  '#6B6B6B', // Texte secondaire
        'rouge-pale': '#FDECEA', // Fonds accentués légers
        // Anciens noms — garder le temps de migrer les composants
        navy:        '#000000',
        action:      '#D4252B',
        'pale-blue': '#F5F4F1',
        mid:         '#6B6B6B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
