import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: process.env.RUN_DB_TESTS !== "1",
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
    coverage: { reporter: ["text", "json"] },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
