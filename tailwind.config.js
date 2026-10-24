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
        line: '#4A5565', // shortcut: 컨트롤 테두리 3:1에 못 미침(2.4:1), 선이 더 또렷해도 되면 #5E6B80 로
        accent: '#57C99A',
        accentInk: '#0E1216',
        danger: '#F2727B',
      },
    },
  },
  plugins: [],
};
