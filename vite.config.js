import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";

export default defineConfig({
  base: "/Budgety/",
  plugins: [
    react(),
    eslint({
      cache: false,
      include: ["src/**/*.{js,jsx}"],
      exclude: ["node_modules", "dist"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@ui": path.resolve(__dirname, "./src/components/ui"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@lib": path.resolve(__dirname, "./src"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@context": path.resolve(__dirname, "./src/context"),
      "@constants": path.resolve(__dirname, "./src/constants"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@theme": path.resolve(__dirname, "./src/theme"),
    },
  },
  server: {
    port: 3000,
  },
});
