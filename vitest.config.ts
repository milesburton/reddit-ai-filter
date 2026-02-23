import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["src/**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/*.integration.test.ts"],
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
