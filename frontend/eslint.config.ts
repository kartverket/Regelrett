import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["dist/"]),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  reactHooks.configs.flat["recommended-latest"],
  {
    settings: {
      react: { version: "19" },
    },
  },
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
);
