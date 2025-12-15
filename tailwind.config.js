/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#014c53',
          50: '#e6f3f4',
          100: '#b3dce0',
          200: '#80c5cb',
          300: '#4daeb6',
          400: '#1a97a1',
          500: '#014c53',
          600: '#013d42',
          700: '#012e32',
          800: '#001f21',
          900: '#001011',
        },
        background: '#f5ece3',
        card: '#faf7f4',
      },
    },
  },
  plugins: [],
};
