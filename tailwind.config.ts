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
        ink: "#0B0B0A",
        ivory: "#F7F4EE",
        sand: "#ECE6DA",
        stone: "#8A8478",
        gold: {
          DEFAULT: "#C9A646",
          dark: "#7A5F17",
          pale: "#F3E8BE",
          mark: "#A8862C",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "system-ui", "Arial", "sans-serif"],
      },
      boxShadow: {
        luxury: "0 24px 70px -20px rgba(11,11,10,.28)",
        soft: "0 1px 2px rgba(11,11,10,.04), 0 8px 24px -12px rgba(11,11,10,.12)",
        lift: "0 2px 4px rgba(11,11,10,.04), 0 24px 48px -16px rgba(11,11,10,.22)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(.22,1,.36,1)",
        spring: "cubic-bezier(.34,1.56,.64,1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": {
          from: { opacity: "0", transform: "scale(.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        bump: {
          "0%,100%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "draw-check": { to: { strokeDashoffset: "0" } },
        sweep: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "fade-up": "fade-up .7s cubic-bezier(.22,1,.36,1) both",
        "fade-in": "fade-in .4s ease-out both",
        "scale-in": "scale-in .35s cubic-bezier(.22,1,.36,1) both",
        "slide-in-right": "slide-in-right .45s cubic-bezier(.22,1,.36,1) both",
        "slide-down": "slide-down .35s cubic-bezier(.22,1,.36,1) both",
        shimmer: "shimmer 1.6s linear infinite",
        bump: "bump .45s cubic-bezier(.34,1.56,.64,1)",
        marquee: "marquee 38s linear infinite",
        "draw-check": "draw-check .7s .25s cubic-bezier(.65,0,.35,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
