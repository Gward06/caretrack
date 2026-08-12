import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// import.meta.dirname needs Node 20.11+; this file gets imported at runtime
// (server/vite.ts pulls it in unconditionally), so it must also work on
// older Node builds like Railway's Node 18 image.
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "client", "src"),
      "@shared": path.resolve(dirname, "shared"),
      "@assets": path.resolve(dirname, "attached_assets"),
    },
  },
  root: path.resolve(dirname, "client"),
  build: {
    outDir: path.resolve(dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
