import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: [path.resolve(__dirname, "./tests/setup.ts")],
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "./tests/empty-module.ts"),
      "@": path.resolve(__dirname, "./"),
    },
  },
});
