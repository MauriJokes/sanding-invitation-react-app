import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { devApi } from "./scripts/dev-api.ts";
import vercelConfig from "./vercel.json" with { type: "json" };

// `vite preview` mirrors the production headers (including the CSP) from vercel.json.
const previewHeaders = Object.fromEntries(
  (vercelConfig.headers[0]?.headers ?? []).map(({ key, value }) => [key, value]),
);

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
  preview: { headers: previewHeaders },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    restoreMocks: true,
    setupFiles: ["tests/setup-sheets.ts", "tests/setup-audio.ts"],
  },
});
