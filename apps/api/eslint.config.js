import nodeConfig from "@codesync/eslint-config/node.js";

export default [
  ...nodeConfig,
  {
    ignores: ["dist/**", "coverage/**", "temp/**"],
  },
];
