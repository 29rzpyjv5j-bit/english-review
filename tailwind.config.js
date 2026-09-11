/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#14171C',
        surface: '#1B1F26',
        surface2: '#20242C',
        ink: '#ECEEF2',
        muted: '#8B93A0',
        line: '#262B33',
        accent: '#57C99A',
        accentInk: '#0E1216',
        danger: '#F2727B',
      },
    },
  },
  plugins: [],
};
