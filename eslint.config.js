import nextConfig from "eslint-config-next/core-web-vitals";

export default [
  ...nextConfig,
  {
    files: ["**/*.{js,jsx}"],
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-var": "error",
      "object-shorthand": "warn",
      "quote-props": ["warn", "as-needed"],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.cjs",
      "*.config.mjs",
      "coverage/**",
      "public/**",
    ],
  },
];
