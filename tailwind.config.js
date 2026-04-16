/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"EB Garamond"', 'Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        vellum: {
          base: '#F4E8D0',
          shadow: '#E8D9B8',
        },
        ink: {
          primary: '#3B2A1A',
          secondary: '#6B4E2E',
          faded: '#A08865',
        },
        accent: {
          red: '#8B2E1F',
        },
      },
    },
  },
  plugins: [],
}
