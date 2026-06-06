/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF9122',
          dark: '#E07A10',
          light: '#FFB05A',
        },
        secondary: {
          DEFAULT: '#01B5D4',
          dark: '#0199B3',
          light: '#4DCCDF',
        },
        tertiary: {
          yellow: '#FDE658',
          pink: '#FFABB0',
        },
        danger: '#D2001E',
        bg: '#FFFCF6',
        surface: '#FFFFFF',
        border: '#E8E0D4',
        text: {
          DEFAULT: '#000000',
          muted: '#666666',
          disabled: '#AAAAAA',
        },
      },
      fontFamily: {
        headline: ['"Luckiest Guy"', 'cursive'],
        body: ['"Google Sans Flex"', 'Google Sans', 'system-ui', 'sans-serif'],
        mono: ['"Roboto Mono"', '"Courier New"', 'monospace'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        heading: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        label: ['13px', { lineHeight: '1.4', fontWeight: '500' }],
        timer: ['56px', { lineHeight: '1', fontWeight: '700' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        input: '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
      },
      animation: {
        'pulse-timer': 'pulseTimer 1s ease-in-out infinite',
        'slide-up': 'slideUp 300ms ease-out',
        'fade-in': 'fadeIn 300ms ease-out',
      },
      keyframes: {
        pulseTimer: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
