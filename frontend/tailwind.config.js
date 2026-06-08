/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ── Core palette: Off-Black / Off-White / Orange / Warm Grays ──
        ink: {
          DEFAULT: '#1a1714',  // Off-black — not pure black
          soft:    '#2c2825',
          muted:   '#3d3a37',
        },
        paper: {
          DEFAULT: '#f7f4ef',  // Off-white — warm cream
          dark:    '#eeebe5',
          darker:  '#e3dfd8',
        },
        orange: {
          50:  '#fff4ed',
          100: '#ffe6d4',
          200: '#fec89a',
          300: '#fda462',
          400: '#fb7c37',
          500: '#f95d0f',  // Main orange
          600: '#e84a07',
          700: '#c03508',
          800: '#982b0e',
          900: '#7b260f',
          950: '#431007',
        },
        gray: {
          50:  '#fafaf9',
          100: '#f4f3f1',
          200: '#e8e6e3',
          300: '#d4d1cc',
          400: '#b3afa9',
          500: '#8c877f',  // Warm mid-gray
          600: '#706b64',
          700: '#5a554f',
          800: '#3f3b37',
          900: '#2a2723',
          950: '#1a1714',
        },
        // Semantic
        success: '#2d6a4f',
        warning: '#b5830a',
        danger:  '#c1361a',
      },

      fontFamily: {
        // Distinctive, non-AI font pairing
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans:    ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      borderRadius: {
        'sm': '3px',
        DEFAULT: '5px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },

      boxShadow: {
        'subtle': '0 1px 2px 0 rgb(26 23 20 / 0.05)',
        'card':   '0 1px 3px 0 rgb(26 23 20 / 0.08), 0 1px 2px -1px rgb(26 23 20 / 0.06)',
        'lifted': '0 4px 12px -2px rgb(26 23 20 / 0.10), 0 2px 6px -2px rgb(26 23 20 / 0.06)',
        'float':  '0 12px 32px -4px rgb(26 23 20 / 0.14), 0 4px 12px -4px rgb(26 23 20 / 0.08)',
        'glow-orange': '0 0 0 3px rgb(249 93 15 / 0.15)',
      },

      animation: {
        'in':        'fadeIn 0.25s ease-out',
        'slide-up':  'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-in':  'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':   'shimmer 1.8s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },

      keyframes: {
        fadeIn:   { from: { opacity: '0' },                              to: { opacity: '1' } },
        slideUp:  { from: { transform: 'translateY(10px)', opacity: '0'}, to: { transform: 'translateY(0)', opacity: '1' } },
        slideIn:  { from: { transform: 'translateX(20px)', opacity: '0'}, to: { transform: 'translateX(0)', opacity: '1' } },
        shimmer:  { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
