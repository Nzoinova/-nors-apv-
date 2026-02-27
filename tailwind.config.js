/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nors: {
          black: '#000000',
          'off-black': '#2B2B2B',
          'dark-gray': '#575757',
          'medium-gray': '#808080',
          'light-gray-2': '#ABABAB',
          'light-gray': '#D6D6D6',
          'off-white': '#F2F2F2',
          white: '#FFFFFF',
          teal: '#415A67',
          'sky-blue': '#9CC7DE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
