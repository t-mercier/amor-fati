import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "af-pink": "#FAD0E5",
        "af-lilac": "#E6D7FF",
        "af-mint": "#D6F5EA",
        "af-sky": "#D9EEFF",
        "af-lemon": "#FFF6C9",
        "af-ink": "#2A2A2A"
      },
      borderRadius: { 
        xl: "1rem", 
        "2xl": "1.5rem" 
      }
    }
  },
  plugins: []
};

export default config;

