/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        dragon: {
          purple: '#7C3AED',
          amber: '#F59E0B',
          dark: '#0F0F0F',
          navy: '#1A1A2E',
          surface: '#16213E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 30s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px #7C3AED' },
          to: { boxShadow: '0 0 25px #7C3AED, 0 0 50px #7C3AED40' },
        },
      },
    },
  },
  plugins: [],
}
