/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#1a6b3c',
          800: '#166534',
          900: '#14532d',
        },
        soil: {
          100: '#fef3c7',
          200: '#fde68a',
          300: '#d97706',
          400: '#b45309',
          500: '#92400e',
        },
        harvest: {
          100: '#fef9c3',
          200: '#fef08a',
          300: '#eab308',
          400: '#ca8a04',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
