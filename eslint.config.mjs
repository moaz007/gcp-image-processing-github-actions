import globals from "globals";
import pluginJs from "@eslint/js";
import pluginJest from "eslint-plugin-jest";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.browser, // Browser globals
        ...globals.node,    // Node.js globals
      },
    },
  },
  pluginJs.configs.recommended, // ESLint recommended config
  pluginJest.configs.recommended, // Jest-specific recommended config
  {
    files: ["**/__tests__/**/*.js"], // Apply Jest plugin only to test files
    plugins: { jest: pluginJest },
  },
];

