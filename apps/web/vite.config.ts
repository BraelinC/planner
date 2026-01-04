import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@healthymama/convex": path.resolve(__dirname, "../../packages/convex/_generated/api"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  envDir: path.resolve(__dirname, "../.."),
});
