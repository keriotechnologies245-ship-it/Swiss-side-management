/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: '#FDFCFB',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#A35E45', // Iten Terracotta
          dark: '#7A4331',
          light: '#C98B74',
          subtle: '#F7EDEA',
        },
        accent: {
          DEFAULT: '#2D3436', // Deep Charcoal
          gold: '#C5A059',
        },
        success: '#27AE60',
        warning: '#F39C12',
        danger: '#E74C3C',
        info: '#3498DB',
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontSize: {
        'xs-label': ['11px', {
          lineHeight: '1.4',
          letterSpacing: '0.08em',
          fontWeight: '700',
        }],
      },
      boxShadow: {
        'premium': '0 4px 20px -4px rgba(163, 94, 69, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.05)',
        'elevated': '0 20px 40px -12px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'system': '16px',
        'input': '12px',
        'modal': '24px',
      }
    },
  },
  plugins: [],
}
