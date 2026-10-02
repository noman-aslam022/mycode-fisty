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
          800: '#2c302d',
          950: '#151816',
        },
        primary: {
          400: '#e2f888',
          500: '#d5f55f',
          600: '#b8dc46',
        },
        secondary: {
          700: '#8a9460',
        },
        accent: {
          500: '#ff5436',
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
      },
      animation: {
        'marquee-fast': 'marquee-fast 20s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
