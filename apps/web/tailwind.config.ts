import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "hsl(222 47% 6%)",
        surface: "hsl(222 40% 9%)",
        "surface-2": "hsl(222 36% 13%)",
        border: "hsl(222 30% 20%)",
        muted: "hsl(220 14% 64%)",
        brand: {
          DEFAULT: "hsl(258 90% 66%)",
          fg: "hsl(0 0% 100%)",
          soft: "hsl(258 90% 74%)",
        },
        accent: "hsl(190 95% 55%)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
