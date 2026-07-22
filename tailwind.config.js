/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./src/app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Stitch "Futuristic Wealth Dashboard" light tokens (from screen HTML)
        primary: {
          main: "#4343D5",
          light: "#5D5FEF",
          dark: "#2E2BC2",
          soft: "#E2E7FF",
          muted: "#C1C1FF",
        },
        brand: {
          DEFAULT: "#4343D5",
          deep: "#131B2E",
          soft: "#F2F3FF",
        },
        surface: {
          DEFAULT: "#FAF8FF",
          low: "#F2F3FF",
          container: "#EAEDFF",
          high: "#E2E7FF",
        },
        income: "#008259",
        expense: "#FF4D4D",
        tertiary: "#006645",
      },
      fontFamily: {
        sans: ['"Geist"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist"', "ui-monospace", "monospace"],
      },
      spacing: {
        18: "4.5rem",
        72: "18rem",
        gutter: "24px",
        "margin-mobile": "20px",
      },
      borderRadius: {
        card: "16px",
        widget: "12px",
        xl: "1.5rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(19, 27, 46, 0.06), 0 1px 2px 0 rgba(19, 27, 46, 0.04)",
        widget: "0 1px 3px 0 rgba(19, 27, 46, 0.06), 0 1px 2px 0 rgba(19, 27, 46, 0.04)",
        elevated: "0 12px 32px -12px rgba(67, 67, 213, 0.22)",
        glow: "0 0 24px rgba(93, 95, 239, 0.28)",
      },
      zIndex: {
        1000: "1000",
      },
    },
  },
  plugins: [],
};
