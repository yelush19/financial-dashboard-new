/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'litay': {
          primary: '#528163',
          'primary-dark': '#17320b',
          accent: '#8dd1bb',
          light: '#e8f5e8',
          dark: '#2c3e50',
        },
      },
      fontFamily: {
        sans: ['Assistant', 'Noto Sans Hebrew', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}