import globals from "globals";
import pluginJs from "@eslint/js";
import pluginJest from "eslint-plugin-jest";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        ...globals.node, // Add Node.js globals
      },
    },
    plugins: {
      jest: pluginJest, // Jest plugin configuration
    },
    rules: {
      ...pluginJest.configs.recommended.rules, // Apply Jest recommended rules
    },
    settings: {
      jest: {
        version: 29, // Specify your Jest version
      },
    },
  },
  pluginJs.configs.recommended,
];

