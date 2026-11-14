import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";
import tseslint from "typescript-eslint";

const forbid = (patterns, message) => ({
  "no-restricted-imports": ["error", { patterns: [{ group: patterns, message }] }],
});

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".vercel", "coverage", "design-assets", "docs", ".github"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    extends: [jsxA11y.flatConfigs.recommended],
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...forbid(
        ["**/server/**", "**/api/**", "mongodb", "googleapis", "@googleapis/*", "node:*"],
        "Browser code must not import server-only modules or Node APIs.",
      ),
    },
  },
  {
    files: ["shared/**/*.ts"],
    rules: forbid(
      ["**/server/**", "**/api/**", "**/src/**", "react", "react-dom", "mongodb", "googleapis", "@googleapis/*", "node:*"],
      "shared/ must stay pure TypeScript usable by both browser and server.",
    ),
  },
  {
    files: ["api/**/*.ts", "server/**/*.ts"],
    languageOptions: { globals: globals.node },
    rules: forbid(["**/src/**", "react", "react-dom"], "Server code must not import browser code."),
  },
  {
    files: ["tests/**/*.{ts,tsx}", "scripts/**/*.ts", "vite.config.ts", "*.js"],
    languageOptions: { globals: globals.node },
  },
  { files: ["*.js"], ...tseslint.configs.disableTypeChecked },
);
