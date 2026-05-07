// ─────────────────────────────────────────────────────────────────
//  THEME CONFIG — edit these values to restyle the entire app
// ─────────────────────────────────────────────────────────────────
const THEME = {
  // Backgrounds — base-200 must be lighter than base-100 so cards pop
  background:       '#0d1117',  // base-100  page background
  surface:          '#161b22',  // base-200  cards, panels, sidebar
  surfaceAlt:       '#21262d',  // base-300  inputs, borders, dividers
  text:             '#e6edf3',  // base-content  primary text

  // Accent colors
  primary:          '#6366f1',  // indigo  — buttons, active nav, highlights
  primaryContent:   '#ffffff',
  secondary:        '#8b5cf6',  // violet  — secondary actions, gradients
  secondaryContent: '#ffffff',
  accent:           '#06b6d4',  // cyan    — used sparingly
  accentContent:    '#ffffff',

  // Semantic states
  error:            '#f85149',
  success:          '#3fb950',
  warning:          '#d29922',
  info:             '#58a6ff',
}
// ─────────────────────────────────────────────────────────────────

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
          'base-100':          THEME.background,
          'base-200':          THEME.surface,
          'base-300':          THEME.surfaceAlt,
          'base-content':      THEME.text,
          'primary':           THEME.primary,
          'primary-content':   THEME.primaryContent,
          'secondary':         THEME.secondary,
          'secondary-content': THEME.secondaryContent,
          'accent':            THEME.accent,
          'accent-content':    THEME.accentContent,
          'error':             THEME.error,
          'success':           THEME.success,
          'warning':           THEME.warning,
          'info':              THEME.info,
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
}
