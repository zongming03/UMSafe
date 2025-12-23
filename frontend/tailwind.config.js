/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{js,jsx,ts,tsx}",
];
export const theme = {
  extend: {
    keyframes: {
      'loading-bar': {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' }
      },
      'float': {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-16px)' }
      }
    },
    animation: {
      'loading-bar': 'loading-bar 1.5s ease-in-out infinite',
      'float': 'float 3s ease-in-out infinite'
    }
  },
};
export const plugins = [];

