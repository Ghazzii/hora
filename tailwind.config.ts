import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        ivory: "#F7F4EE",
        gold: {
          DEFAULT: "#D4AF37",
          dark: "#9D7C1F",
          pale: "#F3E8BE"
        }
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        sans: ["Arial", "Helvetica", "sans-serif"]
      },
      boxShadow: {
        luxury: "0 24px 70px rgba(0,0,0,.14)"
      }
    },
  },
  plugins: [],
};

export default config;
