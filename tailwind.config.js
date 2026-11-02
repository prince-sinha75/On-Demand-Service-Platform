/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#0f0f0e',
          light: '#1a1a18',
          mid: '#252521',
          border: '#33332e',
        },
        ivory: {
          DEFAULT: '#f4f1ea',
          dim: '#d4d0c7',
          muted: '#9a968d',
        },
        lime: {
          DEFAULT: '#c5f82a',
          dark: '#a8d916',
          glow: 'rgba(197, 248, 42, 0.15)',
        },
        teal: {
          DEFAULT: '#2dd4bf',
          dark: '#14b8a6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '10xl': ['10rem', { lineHeight: '0.9' }],
        '11xl': ['14rem', { lineHeight: '0.85' }],
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'decel': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.8s ease-out',
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
