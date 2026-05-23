import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0fdf4', 100: '#dcfce7', 600: '#16a34a', 700: '#1a6b3c', 800: '#166534' },
      },
    },
  },
  plugins: [],
};
export default config;
