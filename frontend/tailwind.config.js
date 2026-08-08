/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F6F7F1",
        surface: "#FFFFFF",
        ink: "#16231C",
        muted: "#5B6B60",
        border: "#E3E7DC",
        brand: {
          50: "#EEF5F0",
          100: "#DCEDE1",
          300: "#8FC3A4",
          500: "#2F7D5A",
          700: "#1F5940",
          900: "#123626",
        },
        risk: {
          low: "#2F7D5A",
          medium: "#DB9A2C",
          high: "#C3452E",
        },
        mango: "#F2A65A",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,54,38,0.06), 0 1px 1px rgba(18,54,38,0.04)",
        pop: "0 8px 24px rgba(18,54,38,0.10)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};
