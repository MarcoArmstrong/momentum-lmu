/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/**/*.{html,js,ts,jsx,tsx}",
    "./src/renderer/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Extend with your custom colors if needed
      },
    },
  },
  plugins: [],
  // Tailwind v4 configuration
  future: {
    hoverOnlyWhenSupported: true,
  },
} 