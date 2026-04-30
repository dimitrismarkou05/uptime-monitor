import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    exclude: ["**/tests/e2e/**", "**/node_modules/**", "**/dist/**"],
    coverage: {
      exclude: [
        "**/tests/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/types/**",
        "**/*.d.ts",
        "**/main.tsx",
        "**/eslint.config.js",
        "**/playwright.config.ts",
        "**/vite.config.ts",
        "**/vitest.config.ts",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
