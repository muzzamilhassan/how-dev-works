import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // recharts is ~85% of the app's JS. Splitting it into its own chunk keeps
        // app code tiny and lets the browser cache the chart library across deploys.
        manualChunks: {
          recharts: ["recharts"],
        },
      },
    },
    // the deliberate recharts vendor chunk sits above the default 500 kB warning
    chunkSizeWarningLimit: 700,
  },
});
