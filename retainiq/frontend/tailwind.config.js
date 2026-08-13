/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#080b14",
          900: "#0d1220",
          800: "#141b2e",
          700: "#1c2540",
          600: "#28325280",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          light: "#a78bfa",
          dark: "#7c3aed",
        },
      },
    },
  },
  plugins: [],
};
