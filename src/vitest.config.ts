import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: path.resolve(__dirname, ".."),
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { environment: "node", include: ["src/tests/**/*.test.ts"], env: { SESSION_SECRET: "x".repeat(40), WS_JWT_SECRET: "y".repeat(40), NODE_ENV: "test" } },
});
