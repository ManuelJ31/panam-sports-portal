import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Panam Sports institutional palette
        navy: {
          DEFAULT: "#1E3058", // primary ink / headings / primary buttons
          soft: "#4A5A7C", // secondary text
          faint: "#8891A3", // tertiary / placeholder text
        },
        blue: {
          DEFAULT: "#2D4C8D", // interactive accent
          soft: "#EAF0FA", // accent tint background
          dim: "#1F3868", // accent hover/pressed
        },
        gold: {
          DEFAULT: "#A39161", // secondary institutional accent
          soft: "#F3EFE4",
          dim: "#8B7A4B",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          off: "#F5F6F8", // institutional light background
          line: "#E3E5EA",
        },
        status: {
          draft: "#6B7280",
          draftBg: "#F1F2F4",
          submitted: "#2D4C8D",
          submittedBg: "#EAF0FA",
          reviewed: "#A39161",
          reviewedBg: "#F3EFE4",
          approved: "#2F7A4F",
          approvedBg: "#EAF3EC",
          returned: "#B23B3B",
          returnedBg: "#F7E9E9",
        },
      },
      fontFamily: {
        // Main typeface used across headings and body copy
        sans: ["var(--font-montserrat)", "Segoe UI", "system-ui", "sans-serif"],
        display: ["var(--font-montserrat)", "Segoe UI", "system-ui", "sans-serif"],
        // Calibri / Aptos are licensed Microsoft fonts, not distributable as
        // web fonts — this stack picks them up when installed (e.g. on
        // Windows) and falls back gracefully everywhere else.
        meta: ["Aptos", "Calibri", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
      },
      maxWidth: {
        prose: "42rem",
        canvas: "78rem",
      },
      letterSpacing: {
        widest2: "0.14em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(30,48,88,0.05), 0 8px 24px -12px rgba(30,48,88,0.14)",
        cardHover: "0 1px 2px rgba(30,48,88,0.06), 0 16px 32px -12px rgba(30,48,88,0.20)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
