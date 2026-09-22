/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#3b82f6',
          500: '#0066FF', // Vertofi Official Cobalt Blue
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001a40',
          950: '#000f26',
        },
        vertofi: {
          blue: '#0066FF',
          'blue-dark': '#0052CC',
          gold: '#D99B16',
          'gold-light': '#FEF3C7',
          'gold-dark': '#B45309',
          red: '#E52320',
          'red-light': '#FEE2E2',
          'red-dark': '#B91C1C',
          dark: '#0F172A',
        },
        slate: {
          850: '#152032',
          950: '#0b1320',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'brand-glow': '0 0 20px -3px rgba(0, 102, 255, 0.35)',
        'gold-glow': '0 0 20px -3px rgba(217, 155, 22, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 102, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 102, 255, 0.45)' },
        }
      }
    },
  },
  plugins: [],
}
