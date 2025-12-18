/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#7F1D1D' }, // Vino intenso premium
        maiz: { DEFAULT: '#F59E0B' }, // Ambar vibrante
        chile: { DEFAULT: '#EF4444' }, // Rojo vibrante
        crema: { DEFAULT: '#F9FAFB' }, // Gray-50 (Casi blanco)
        humo: { DEFAULT: '#374151' }, // Gray-700 (Texto secundario)
        surface: { DEFAULT: '#FFFFFF' }, // Blanco puro para tarjetas
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
