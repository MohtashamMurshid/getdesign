import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// NOTE: This file is NOT used at build/dev time. Electron-Vite reads
// `electron.vite.config.ts`. This shim exists solely so tools like the
// shadcn CLI can detect the project as a Vite project and resolve the
// renderer source/alias correctly.
export default defineConfig({
  root: resolve(__dirname, "src/renderer"),
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/renderer/src"),
      "@renderer": resolve(__dirname, "src/renderer/src"),
    },
  },
  plugins: [react(), tailwindcss()],
});
