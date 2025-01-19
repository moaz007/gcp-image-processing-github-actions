import globals from "globals";
import pluginJs from "@eslint/js";
import pluginJest from "eslint-plugin-jest"; // Ensure jest plugin is installed

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
      jest: pluginJest, // Define Jest plugin as an object
    },
    rules: {
      ...pluginJest.configs.recommended.rules, // Use Jest recommended rules
    },
  },
  pluginJs.configs.recommended,
];

