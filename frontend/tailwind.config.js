/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        oceanPrimary: '#0A3D91',
        oceanSecondary: '#2F80ED',
        oceanAccent: '#56CCF2',
        oceanBg: '#F4FAFF',
        darkNavy: '#1A2A44',
        darkBg: '#06152d',
        darkCard: '#0c1f3f',
        cyanAccent: '#56CCF2',
        emeraldAccent: '#2F80ED',
        goldAccent: '#F2994A',
        statusSuccess: '#27AE60',
        statusWarning: '#F2994A',
        statusDanger: '#EB5757',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
