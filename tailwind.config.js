/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          main: "#000000",
          light: "#333333",
          dark: "#000000",
        },
      },
      spacing: {
        18: "4.5rem",
        72: "18rem",
      },
      borderRadius: {
        card: "12px",
        widget: "8px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        widget:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
