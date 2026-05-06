/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        compliance: {
          yes: '#16a34a',
          no: '#dc2626',
          na: '#94a3b8',
          pending: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
