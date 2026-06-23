/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0b1120',
        panel: '#0f172a',
        accent: {
          DEFAULT: '#3b82f6',
          soft: 'rgba(59,130,246,0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 30px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
}
