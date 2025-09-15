import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      reporter: ["text", "json"],
      exclude: [
        "node_modules/",
        "dist/",
        "examples/**",
        "tsup.config.ts",
        "vitest.config.*",
      ],
    },
  },
});
