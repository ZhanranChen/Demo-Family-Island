import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "outputs/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Feature folders intentionally import across "features/*" — keep this
      // off; boundaries are enforced by code review, not lint, for now.
      "import/no-cycle": "off",
    },
  },
];

export default eslintConfig;
