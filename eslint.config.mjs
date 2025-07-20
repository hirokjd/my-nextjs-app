import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // React specific rules
      "react/prop-types": "off", // Using TypeScript-like prop validation
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      
      // General code quality
      "no-console": "warn", // Warn about console.log in production
      "no-unused-vars": "warn",
      "prefer-const": "error",
      "no-var": "error",
      
      // Import rules
      "import/order": [
        "error",
        {
          "groups": [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index"
          ],
          "newlines-between": "always"
        }
      ],
      
      // Formatting
      "indent": ["error", 2],
      "quotes": ["error", "single"],
      "semi": ["error", "always"],
      "comma-dangle": ["error", "always-multiline"]
    }
  }
];

export default eslintConfig;
