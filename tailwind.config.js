/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        pulse: {
          cyan: '#06b6d4',
          purple: '#7c3aed'
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(124, 58, 237, 0.35)",
        'inner-glow': "inset 0 0 40px rgba(6, 182, 212, 0.25)"
      }
    }
  },
  plugins: []
};



