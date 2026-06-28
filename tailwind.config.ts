import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1a2744",
          foreground: "#ffffff",
          50: "#eef1f8",
          100: "#d5dced",
          200: "#aab9db",
          300: "#7f96c9",
          400: "#5473b7",
          500: "#1a2744",
          600: "#162039",
          700: "#12192e",
          800: "#0e1223",
          900: "#0a0c18",
        },
        accent: {
          DEFAULT: "#c9a84c",
          foreground: "#ffffff",
          50: "#fdf8ec",
          100: "#f9edd0",
          200: "#f3dba1",
          300: "#edc972",
          400: "#e7b743",
          500: "#c9a84c",
          600: "#a8863d",
          700: "#87642e",
          800: "#66421f",
          900: "#452010",
        },
        background: "#f8f7f2",
        foreground: "#1a1a1a",
        muted: {
          DEFAULT: "#f3f2ed",
          foreground: "#6b7280",
        },
        success: {
          DEFAULT: "#166534",
          foreground: "#ffffff",
        },
        danger: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        border: "#e2e0d9",
        input: "#e2e0d9",
        ring: "#c9a84c",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a1a",
        },
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-source-serif)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "Courier New", "monospace"],
        sans: ["var(--font-source-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card: "0 2px 16px 0 rgba(26,39,68,0.08)",
        elevated: "0 8px 32px 0 rgba(26,39,68,0.12)",
        gold: "0 0 0 2px rgba(201,168,76,0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
