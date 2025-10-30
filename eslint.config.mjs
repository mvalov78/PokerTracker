import { fixupConfigRules } from "@eslint/compat";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // Игнорируемые файлы
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "migrations/**",
      "mvalovpokertracker/**",
      "*.backup",
      ".vscode/**",
      ".idea/**",
      "next-env.d.ts",
      "**/*.config.js",
      "**/*.config.ts",
      "**/*.config.mjs",
    ],
  },

  // Базовые правила JS
  pluginJs.configs.recommended,

  // TypeScript правила
  ...tseslint.configs.recommended,

  // React правила
  ...fixupConfigRules(pluginReactConfig),

  // Глобальные настройки для всех файлов
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // TypeScript правила
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/no-require-imports": "warn",

      // React правила
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // Общие правила
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-debugger": "warn",
    },
  },

  // Специальные правила для тестовых файлов
  {
    files: [
      "**/__tests__/**/*.{js,ts,jsx,tsx}",
      "**/*.test.{js,ts,jsx,tsx}",
      "**/*.spec.{js,ts,jsx,tsx}",
      "jest.setup.js",
      "jest.config.js",
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },
];
