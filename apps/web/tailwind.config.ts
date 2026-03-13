import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4F7CF7',
        success: '#2ECC71',
        warning: '#F39C12',
        danger: '#E74C3C',
        streak: '#9B59B6',
        achievement: '#F1C40F',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
