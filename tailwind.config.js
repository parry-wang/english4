/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#E8EDF2',
          100: '#D1DBE5',
          200: '#A3B7CB',
          300: '#7593B1',
          400: '#476F97',
          500: '#1B3A5C',
          600: '#162E4A',
          700: '#112338',
          800: '#0C1726',
          900: '#060C13',
        },
        accent: {
          50: '#FFF0E8',
          100: '#FFD9C7',
          200: '#FFB38E',
          300: '#FF8D56',
          400: '#FF6B35',
          500: '#E55A24',
          600: '#B8481D',
          700: '#8B3615',
          800: '#5E240E',
          900: '#311207',
        },
        success: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
        },
        danger: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          400: '#EF5350',
          500: '#F44336',
          600: '#E53935',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"Poppins"', 'system-ui', 'sans-serif'],
        display: ['"Poppins"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
