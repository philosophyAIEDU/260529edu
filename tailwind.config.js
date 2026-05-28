/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae2',
          300: '#b0bac8',
          400: '#8593a8',
          500: '#66758d',
          600: '#515d74',
          700: '#434c5e',
          800: '#3a4150',
          900: '#343a45',
          950: '#22262e',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['Georgia', 'Noto Serif KR', 'serif'],
      },
    },
  },
  plugins: [],
}
