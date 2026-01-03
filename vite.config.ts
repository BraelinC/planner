import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "convex/_generated/api": path.resolve(import.meta.dirname, "convex", "_generated", "api"),
      "convex/_generated/dataModel": path.resolve(import.meta.dirname, "convex", "_generated", "dataModel"),
      "convex/_generated": path.resolve(import.meta.dirname, "convex", "_generated"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
