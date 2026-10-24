/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./partials/**/*.html",
    "./services/**/*.html",
    "./articles/**/*.html",
    "./members/**/*.html"
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        brand: {
          green: '#106030',
          dark: '#0c4a25',
          gold: '#FFCC00',
          offwhite: '#FAF9F5'
        }
      }
    }
  },
  plugins: [],
}
