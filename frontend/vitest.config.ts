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
      ],
    },
  },
});
