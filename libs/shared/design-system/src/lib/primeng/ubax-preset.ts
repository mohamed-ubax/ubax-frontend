// ============================================================
// UBAX Design System — PrimeNG Preset (tokens Figma)
// Extracted from Figma: BACK-OFFICE-UBAX
//
// NOTE: Ce preset documente les tokens visuels extraits de Figma.
// L'app admin utilise déjà @ubax-workspace/ubax-web-shell/theme.
// Les valeurs ici servent de référence et peuvent être fusionnées
// dans le preset existant (libs/ubax-web/shell/src/lib/theme/).
//
// Compatible avec @primeuix/themes (definePreset API).
// ============================================================

// ── Semantic color tokens (Figma → PrimeNG) ───────────────────
export const UbaxColorTokens = {
  // Primary = brand-blue (#2b7fff)
  primary: {
    50:  '#e8f0ff',
    100: '#c5d8ff',
    200: '#9dbeff',
    300: '#70a3ff',
    400: '#4d8fff',
    500: '#2b7fff',
    600: '#2470e8',
    700: '#1a5ec9',
    800: '#124daa',
    900: '#0a3a80',
    950: '#062660',
  },

  // Surface scale (light mode)
  surface: {
    0:   '#ffffff',
    50:  '#f8faff',   // neutral-50
    100: '#f7f7f7',   // neutral-100
    200: '#ecf2f7',   // neutral-200 (page bg)
    300: '#e1e4ed',   // neutral-300 (borders)
    400: '#c9c9c9',   // neutral-400
    500: '#979797',   // neutral-500 (muted)
    600: '#6e6e6e',   // neutral-600
    700: '#444444',   // neutral-700
    800: '#292929',   // neutral-800
    900: '#1c1c1c',   // neutral-900 (primary text)
    950: '#222222',   // neutral-950 (body text)
  },
} as const;

// ── CSS custom property overrides (applied via styles.scss) ───
// These map directly to PrimeNG's --p-* variables.
// Already partially set in apps/ubax-admin/src/styles.scss.
export const UbaxCssTokens = {
  // Buttons
  '--p-button-border-radius':        '5px',
  '--p-button-sm-font-size':         '12px',
  '--p-button-lg-font-size':         '16px',

  // Inputs
  '--p-inputtext-border-radius':     '6px',
  '--p-inputtext-border-color':      '#e1e4ed',
  '--p-inputtext-focus-border-color':'#2b7fff',
  '--p-inputtext-shadow':            '0 1px 4px 0 rgba(25,33,61,0.08)',

  // Select
  '--p-select-border-radius':        '6px',
  '--p-select-border-color':         '#e1e4ed',

  // DatePicker
  '--p-datepicker-border-radius':    '6px',

  // Card
  '--p-card-border-radius':          '10px',
  '--p-card-shadow':                 '0 1px 4px 0 rgba(25,33,61,0.08)',
  '--p-card-body-padding':           '24px',

  // Dialog
  '--p-dialog-border-radius':        '16px',
  '--p-dialog-header-padding':       '24px 24px 16px',
  '--p-dialog-content-padding':      '0 24px 24px',
  '--p-dialog-footer-padding':       '16px 24px 24px',

  // Badge
  '--p-badge-border-radius':         '2px',
  '--p-badge-font-size':             '12px',

  // Paginator
  '--p-paginator-nav-button-border-radius': '6px',
  '--p-paginator-nav-button-width':         '36px',
  '--p-paginator-nav-button-height':        '36px',

  // Toast
  '--p-toast-border-radius':         '10px',
  '--p-toast-shadow':                '0 4px 16px 0 rgba(25,33,61,0.12)',
} as const;

// ── Status badge color map ─────────────────────────────────────
export const UbaxStatusColors = {
  confirmed:   { bg: '#e1ffe9', text: '#34c759' },
  pending:     { bg: '#ffeddd', text: '#e87d1e' },
  cancelled:   { bg: '#ffdbdd', text: '#e7000b' },
  active:      { bg: '#e1ffe9', text: '#34c759' },
  suspended:   { bg: '#ffdbdd', text: '#e7000b' },
  available:   { bg: '#e1ffe9', text: '#34c759' },
  unavailable: { bg: '#f7f7f7', text: '#979797' },
  info:        { bg: '#e8f0ff', text: '#2b7fff' },
  neutral:     { bg: '#f7f7f7', text: '#979797' },
} as const;

// ── Brand palette (for reference / documentation) ─────────────
export const UbaxBrandColors = {
  navy:   '#1a3047',
  orange: '#e87d1e',
  blue:   '#2b7fff',
  teal:   '#009966',
} as const;
