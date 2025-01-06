import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      lilconfig: "./browser-polyfill.js",
      os: "./browser-polyfill.js",
    },
  },
});
