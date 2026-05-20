import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Webflow export (vendor JS/CSS/HTML — not authored here)
    "public/**/*.html",
    "public/css/**",
    "public/js/**",
    "public/images/**",
    "public/documents/**",
    "webflow/**",
  ]),
]);

export default eslintConfig;
