/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./src/app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // CSS variables swap for light (Luminous Precision) / dark (Obsidian + brand)
        primary: {
          main: "var(--color-primary)",
          light: "var(--color-primary-container)",
          dark: "var(--color-primary-dark)",
          soft: "var(--color-primary-soft)",
          muted: "var(--color-primary-muted)",
        },
        brand: {
          DEFAULT: "var(--color-primary)",
          deep: "var(--color-on-surface)",
          soft: "var(--color-surface-low)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          low: "var(--color-surface-low)",
          container: "var(--color-surface-container)",
          high: "var(--color-surface-high)",
          highest: "var(--color-surface-highest)",
        },
        card: "var(--color-card)",
        outline: {
          DEFAULT: "var(--color-outline)",
          variant: "var(--color-outline-variant)",
        },
        "on-surface": {
          DEFAULT: "var(--color-on-surface)",
          variant: "var(--color-on-surface-variant)",
        },
        income: {
          DEFAULT: "var(--color-income)",
          soft: "var(--color-income-soft)",
        },
        expense: {
          DEFAULT: "var(--color-expense)",
          soft: "var(--color-expense-soft)",
        },
        tertiary: "var(--color-tertiary)",
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
        card: "var(--shadow-card)",
        widget: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        glow: "var(--shadow-glow)",
      },
      zIndex: {
        1000: "1000",
      },
    },
  },
  plugins: [],
};
