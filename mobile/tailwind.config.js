/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#EA580C',
        'primary-dark': '#C2410C',
        accent: '#16A34A',
        'accent-dark': '#15803D',
      },
    },
  },
  plugins: [],
}
