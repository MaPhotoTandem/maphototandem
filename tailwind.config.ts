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
        rouge:  '#D4252B', // CTA, boutons, accents principaux
        noir:   '#111111', // Titres, nav, texte principal
        creme:  '#FAF7F2', // Fond pages, cartes
        dore:   '#9C8060', // Accent secondaire, texte mid-tone
        // Anciens noms — garder le temps de migrer les composants
        navy:      '#111111',
        action:    '#D4252B',
        'pale-blue': '#FAF7F2',
        mid:       '#9C8060',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
