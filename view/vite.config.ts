import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";

import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [viteReact()],
  build: {
    outDir: "../server/view-build/",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/mcp/*": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
