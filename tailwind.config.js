/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          50: '#f8f6f0',
          100: '#f0ece1',
          200: '#e2dbc9',
          300: '#d5cfc1',
          800: '#262925',
          900: '#1a1d1b',
          950: '#111312',
        },
        foreground: {
          50: '#f8f6f0',
          100: '#f0ece1',
          300: '#c5c2b8',
          400: '#a3a097',
          500: '#8b9187',
          600: '#646860',
          700: '#423e38',
          800: '#2c302d',
          950: '#151816',
        },
        primary: {
          50: '#f8fde8',
          400: '#e2f888',
          500: '#d5f55f',
          600: '#b8dc46',
          700: '#9abf30',
        },
        secondary: {
          100: '#f5ede8',
          600: '#b8724a',
          700: '#8a9460',
          900: '#4a2e1e',
          950: '#2e1b10',
        },
        accent: {
          100: '#fdeae6',
          400: '#ff7a62',
          500: '#ff5436',
          600: '#e03e22',
          700: '#b82e14',
          900: '#6b160a',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['"Space Grotesk"', 'sans-serif'],
        label: ['"DM Mono"', 'monospace'],
      },
      keyframes: {
        'marquee-fast': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '70%': { transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'card-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'marquee-fast': 'marquee-fast 20s linear infinite',
        float: 'float 3s ease-in-out infinite',
        'float-slow': 'float-slow 4s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease both',
        'fade-in': 'fade-in 0.4s ease both',
        'scale-in': 'scale-in 0.35s ease both',
        pop: 'pop 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'card-in': 'card-in 0.4s ease both',
        'slide-in-right': 'slide-in-right 0.3s ease both',
      },
    },
  },
  plugins: [],
}

