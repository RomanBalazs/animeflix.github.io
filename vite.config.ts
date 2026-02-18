import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: './' -> GitHub Pages aldomain + repo alútvonalon stabil (relatív assetek)
export default defineConfig({
  plugins: [react()],
  base: "./"
});
