/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        brand:  { DEFAULT: '#5B2A3C' }, // vino
        maiz:   { DEFAULT: '#D1A116' },
        chile:  { DEFAULT: '#E23A2B' },
        crema:  { DEFAULT: '#F8F5F0' },
        humo:   { DEFAULT: '#1A1217' },
      },
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,.35)',
      },
    },
  },
  plugins: [],
};
