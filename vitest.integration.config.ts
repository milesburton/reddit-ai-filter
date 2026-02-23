import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use node environment — jsdom lacks Float32Array support needed by onnxruntime-web
    environment: "node",
    globals: true,
    include: ["src/**/*.integration.test.ts"],
    // Integration tests download the ONNX model (~90 MB) and run inference.
    // Allow up to 5 minutes for the full suite.
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
