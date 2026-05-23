/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          300: '#86efac',
          600: '#16a34a',
          700: '#1a6b3c',
          800: '#166534',
        },
      },
    },
  },
  plugins: [],
};
