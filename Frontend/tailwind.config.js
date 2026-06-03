/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        ge: {
          navy:    '#0a0e1a',
          dark:    '#0f1524',
          card:    '#141928',
          surface: '#1a2035',
          elevated:'#1f2640',
          border:  '#2a3350',
          border2: '#334066',
          accent:  '#00d4aa',
          blue:    '#0099ff',
          purple:  '#7c3aed',
          warn:    '#f59e0b',
          danger:  '#ef4444',
          success: '#10b981',
          text1:   '#e8ecf4',
          text2:   '#a0aec0',
          text3:   '#6b7a99',
        }
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':  'spin 0.7s linear infinite',
      }
    }
  },
  plugins: []
}