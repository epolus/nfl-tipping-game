/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nfl: {
          navy: '#013369',
          red: '#D50A0A',
        },
      },
    },
  },
  plugins: [],
};
