/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: 'var(--tg-theme-bg-color)',
          secondary: 'var(--tg-theme-secondary-bg-color)',
          text: 'var(--tg-theme-text-color)',
          hint: 'var(--tg-theme-hint-color)',
          link: 'var(--tg-theme-link-color)',
          button: 'var(--tg-theme-button-color)',
          buttonText: 'var(--tg-theme-button-text-color)',
          accent: 'var(--tg-theme-accent-text-color)',
          destructive: 'var(--tg-theme-destructive-text-color)',
          header: 'var(--tg-theme-header-bg-color)',
          section: 'var(--tg-theme-section-bg-color)',
          sectionText: 'var(--tg-theme-section-header-text-color)',
          subtitle: 'var(--tg-theme-subtitle-text-color)',
        }
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'tg': '12px',
        'tg-lg': '16px',
        'tg-xl': '20px',
      }
    },
  },
  plugins: [],
}