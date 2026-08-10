/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // Core Brand Colors
        'cf-dark': '#0a0a0a',        // The absolute background (deepest dark)
        'cf-surface': '#111111',     // Slightly lighter for cards/panels
        'cf-surface-hover': '#1a1a1a', 
        'cf-orange': '#ff6b00',      // The primary glowing accent
        'cf-orange-dim': 'rgba(255, 107, 0, 0.2)', // For subtle glows
        // Utilities
        'cf-border': 'rgba(255, 255, 255, 0.1)',
        'cf-text-muted': '#888888',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};