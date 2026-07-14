import reactConfig from "@codesync/eslint-config/react.js";

export default [
  ...reactConfig,
  {
    ignores: ["dist/**", "coverage/**", "vite.config.ts", "temp/**"],
  },
];
