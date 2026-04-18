/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        background: '#F5F5F5',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#A35E45', // Iten Terracotta from Logo
          dark: '#8B4E38',
          light: '#C67C5C',
        },
        secondary: '#2C2C2C',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontSize: {
        'xs-label': ['11px', {
          lineHeight: '1.4',
          letterSpacing: '0.5px',
          fontWeight: '500',
        }],
      },
      boxShadow: {
        'system': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'modal': '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'system': '8px',
        'input': '6px',
        'modal': '12px',
      }
    },
  },
  plugins: [],
}
