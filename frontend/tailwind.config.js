/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50: '#faf7f2',
          100: '#f3ece1',
          200: '#e5d7c3',
          300: '#d4bea0',
          400: '#be9e7a',
          500: '#a8825c',
          600: '#8c6648',
          700: '#71503b',
          800: '#5e4334',
          900: '#4f382e',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 10px 30px -5px rgba(22, 163, 74, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)'
      }
    },
  },
  plugins: [],
}
