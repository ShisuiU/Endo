import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Le pattern "état null pendant le SSR, rempli au montage" (date
      // locale, media queries, etc.) est le pattern recommandé par React
      // pour éviter les mismatches d'hydratation — cf.
      // https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content
      // On le garde en avertissement plutôt que de contorsionner ce code
      // volontaire pour faire taire la règle.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
