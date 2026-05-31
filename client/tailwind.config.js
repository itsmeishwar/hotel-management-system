/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCFA',
          100: '#F7F5F2',
          200: '#EDE9E3',
          300: '#DDD6CC'
        },
        ink: {
          DEFAULT: '#1C1917',
          muted: '#57534E',
          faint: '#A8A29E'
        },
        olive: {
          DEFAULT: '#4A5D4E',
          light: '#6B7F6F',
          dark: '#354239'
        },
        terracotta: {
          DEFAULT: '#B85C38',
          light: '#D4785A',
          muted: '#E8C4B4'
        },
        status: {
          available: '#4A5D4E',
          occupied: '#B85C38',
          cleaning: '#C4A035',
          maintenance: '#78716C',
          dirty: '#9A3412',
          clean: '#4A5D4E'
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif']
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(28, 25, 23, 0.06)',
        card: '0 1px 3px rgba(28, 25, 23, 0.08)'
      }
    }
  },
  plugins: []
};
