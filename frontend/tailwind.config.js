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
        champ: {
          bg: '#101B1A',
          card: '#172827',
          cardHover: '#1C3130',
          border: '#233E3C',
          primary: '#53E0AD',
          primaryHover: '#3ecf9a',
          blue: '#38BDF8',
          purple: '#A78BFA',
          gold: '#FBBF24',
          silver: '#CBD5E1',
          bronze: '#CD7F32',
          danger: '#FB7185',
          text: '#F3F7F5',
          muted: '#8EA8A4',
          darkMuted: '#142423'
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        inter: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
