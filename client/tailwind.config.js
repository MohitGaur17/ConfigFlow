/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic Surface Colors
        'surface': '#131313',
        'surface-dim': '#131313',
        'surface-bright': '#3a3939',
        'surface-container-lowest': '#0e0e0e',
        'surface-container-low': '#1c1b1b',
        'surface-container': '#201f1f',
        'surface-container-high': '#2a2a2a',
        'surface-container-highest': '#353534',
        
        // Semantic Text/Icon Colors
        'on-surface': '#e5e2e1',
        'on-surface-variant': '#e2bfb0',
        'inverse-surface': '#e5e2e1',
        'inverse-on-surface': '#313030',
        
        // Borders and Outlines
        'outline': '#a98a7d',
        'outline-variant': '#5a4136',
        'outline-hairline': 'rgba(255, 255, 255, 0.1)',
        
        // Primary (Warm Orange)
        'primary': '#ffb693',
        'on-primary': '#561f00',
        'primary-container': '#ff6b00',
        'on-primary-container': '#572000',
        'primary-fixed': '#ffdbcc',
        'primary-fixed-dim': '#ffb693',
        
        // Secondary & Tertiary
        'secondary': '#c0c1ff',
        'secondary-container': '#3131c0',
        'tertiary': '#4edea3',
        'tertiary-container': '#00ae78',
        
        // Backgrounds & Utilities
        'background': '#131313',
        'terminal-bg': '#09090B',
        'surface-elevated': '#111111',
        'code-indigo': '#C7D2FE',
        'error-red': '#EF4444',
        'warning-amber': '#F59E0B',
      },
      fontFamily: {
        'display-hero': ['Inter', 'sans-serif'],
        'headline-lg': ['Inter', 'sans-serif'],
        'headline-md': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'code-base': ['Geist Mono', 'monospace'],
        'label-caps': ['Geist Mono', 'monospace'],
        'label-tech': ['Geist Mono', 'monospace'],
      },
      fontSize: {
        'display-hero': ['72px', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '900' }],
        'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        'code-base': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'label-caps': ['11px', { lineHeight: '1.0', letterSpacing: '0.15em', fontWeight: '700' }],
        'label-tech': ['12px', { lineHeight: '1.2', fontWeight: '500' }],
      },
      spacing: {
        'base': '4px',
        'gutter': '16px',
        'margin-safe': '32px',
        'panel-gap': '1px',
        'container-max': '1440px',
      },
      borderRadius: {
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        'full': '9999px',
      }
    },
  },
  plugins: [],
};