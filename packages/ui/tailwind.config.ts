import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../apps/web/src/**/*.{ts,tsx}',
    '../../apps/admin/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2AA98C',
          'primary-light': '#D1EDE5',
          secondary: '#7BBAA9',
          accent: '#B9895D',
          beige: '#DEB88F',
          brown: '#6A4F36',
          text: '#263238',
          bg: '#F7FBF9',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
