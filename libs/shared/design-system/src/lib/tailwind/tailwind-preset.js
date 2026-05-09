// ============================================================
// UBAX Design System — Tailwind Preset
// Extracted from Figma: BACK-OFFICE-UBAX
// Use in tailwind.config.js: presets: [require('./tailwind-preset')]
// ============================================================

/** @type {import('tailwindcss').Config} */
module.exports = {
 theme: {
  extend: {
   // ── Colors ──────────────────────────────────────────────
   colors: {
    brand: {
     navy: '#1a3047',
     orange: '#e87d1e',
     blue: '#2b7fff',
     teal: '#009966',
    },
    success: {
     DEFAULT: '#34c759',
     bg: '#e1ffe9',
    },
    warning: {
     DEFAULT: '#e87d1e',
     bg: '#ffeddd',
    },
    danger: {
     DEFAULT: '#e7000b',
     bg: '#ffdbdd',
    },
    info: {
     DEFAULT: '#2b7fff',
     bg: '#e8f0ff',
    },
    neutral: {
     50: '#f8faff',
     100: '#f7f7f7',
     200: '#ecf2f7',
     300: '#e1e4ed',
     400: '#c9c9c9',
     500: '#979797',
     600: '#6e6e6e',
     700: '#444444',
     800: '#292929',
     900: '#1c1c1c',
     950: '#222222',
    },
    surface: {
     page: '#ecf2f7',
     card: '#ffffff',
     sidebar: '#1a3047',
     header: '#ffffff',
    },
   },

   // ── Typography ──────────────────────────────────────────
   fontFamily: {
    primary: ['Lexend', 'system-ui', '-apple-system', 'sans-serif'],
    secondary: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    sans: ['Lexend', 'system-ui', '-apple-system', 'sans-serif'],
   },
   fontSize: {
    'xs': ['8px', { lineHeight: '1.4' }],
    'sm': ['10px', { lineHeight: '20px' }],
    'base': ['12px', { lineHeight: '20px' }],
    'md': ['13px', { lineHeight: '20px' }],
    'lg': ['14px', { lineHeight: '20px' }],
    'xl': ['15px', { lineHeight: '19px' }],
    '2xl': ['16px', { lineHeight: '19px' }],
    '3xl': ['20px', { lineHeight: 'normal' }],
    '4xl': ['22px', { lineHeight: 'normal' }],
    '5xl': ['24px', { lineHeight: 'normal' }],
   },
   fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
   },

   // ── Spacing ─────────────────────────────────────────────
   spacing: {
    '0.5': '2px',
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '7': '28px',
    '8': '32px',
    '9': '36px',
    '10': '40px',
    '12': '48px',
    '14': '56px',
    '16': '64px',
    '20': '80px',
    '24': '96px',
    // Layout
    'sidebar': '314px',
    'header': '81px',
   },

   // ── Border Radius ────────────────────────────────────────
   borderRadius: {
    'none': '0px',
    'xs': '2px',
    'sm': '5px',
    'md': '6px',
    'lg': '8px',
    'xl': '10px',
    '2xl': '12px',
    '3xl': '16px',
    'full': '9999px',
   },

   // ── Box Shadows ──────────────────────────────────────────
   boxShadow: {
    'card': '0 1px 4px 0 rgba(25, 33, 61, 0.08)',
    'dropdown': '0 2px 8px 0 rgba(25, 33, 61, 0.10)',
    'modal': '0 4px 16px 0 rgba(25, 33, 61, 0.12)',
    'overlay': '0 8px 32px 0 rgba(25, 33, 61, 0.16)',
    'dot': '0 1px 4px 0 rgba(25, 33, 61, 0.08)',
   },

   // ── Layout ───────────────────────────────────────────────
   width: {
    'sidebar': '314px',
   },
   height: {
    'header': '81px',
   },
   minWidth: {
    'sidebar': '314px',
   },

   // ── Z-index ──────────────────────────────────────────────
   zIndex: {
    'sidebar': '50',
    'header': '100',
    'dropdown': '200',
    'modal': '300',
    'toast': '400',
   },

   // ── Transitions ──────────────────────────────────────────
   transitionTimingFunction: {
    'ubax': 'cubic-bezier(0.22, 1, 0.36, 1)',
    'ubax-soft': 'cubic-bezier(0.16, 1, 0.3, 1)',
   },
   transitionDuration: {
    'fast': '150ms',
    'base': '250ms',
    'slow': '400ms',
    'slower': '620ms',
   },

   // ── Screens (breakpoints) ────────────────────────────────
   screens: {
    'mobile': '320px',
    'tablet': '768px',
    'desktop': '1024px',
    'wide': '1440px',
    'ultra': '1920px',
   },
  },
 },
};
