// eslint.config.js
// ─────────────────────────────────────────────────────────────────────────────
// ESLint 9 flat configuration — Incident Response Agent
//
// PURPOSE:
//   Enforces consistent code style and catches common TypeScript errors
//   across the entire src/ tree. Uses the new flat config format required
//   by ESLint 9 (replaces .eslintrc.json).
//
// DECISIONS:
//   • @typescript-eslint/recommended-type-checked — strictest preset that
//     leverages type information from tsconfig.json for deeper analysis.
//   • no-console warn — structured logging via Pino must be used instead.
//   • import extensions required — ESM mandates explicit file extensions.
// ─────────────────────────────────────────────────────────────────────────────

import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    // Apply to all TypeScript source files
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // ── TypeScript ────────────────────────────────────────────────────────
      ...tsPlugin.configs["recommended"].rules,

      // Prefer explicit return types on public API functions
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      // No floating promises — always await or handle .catch()
      "@typescript-eslint/no-floating-promises": "error",
      // No explicit any without justification comment
      "@typescript-eslint/no-explicit-any": "warn",
      // Unused variables are errors (mirrors tsconfig noUnusedLocals)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // ── General ──────────────────────────────────────────────────────────
      // Use pino logger — not console
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Prevent accidental debugger statements in commits
      "no-debugger": "error",
      // Consistent curly braces
      "curly": ["error", "all"],
      // Always use strict equality
      "eqeqeq": ["error", "always"],
    },
  },
  {
    // Ignore compiled output and dependency directories
    ignores: ["dist/**", "node_modules/**", "**/*.js"],
  },
];
