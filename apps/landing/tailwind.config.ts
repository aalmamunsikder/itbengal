import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        textPrimary: 'oklch(0.13 0.028 261.692)',
        textSecondary: '#ffffff',
        textTertiary: 'oklab(0.882 -0.0161359 -0.0567506 / 0.8)',
        textInverse: 'oklch(0.21 0.034 264.665)',
        surfaceBase: '#000000',
        surfaceRaised: 'oklch(0.208 0.042 265.755)',
        surfaceStrong: 'oklch(0.872 0.01 258.338)',
        borderDefault: 'oklch(0.928 0.006 264.531)',
        borderMuted: 'oklch(0.546 0.245 262.881)',
        focusRing: 'oklab(0.707 -0.00331825 -0.0217483 / 0.5)',
        // primary theme brand colors
        primaryBlue: '#0052cc',
        accentBlue: '#0066ff',
        lightBlue: '#e6f0ff',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '55%': { opacity: '0.9', transform: 'scale(0.99)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
