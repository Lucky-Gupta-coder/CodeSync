export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@codesync/types$": "<rootDir>/../../packages/types/src/index.ts",
    "^@codesync/validators$": "<rootDir>/../../packages/validators/src/index.ts",
    "^@codesync/utils$": "<rootDir>/../../packages/utils/src/index.ts",
    "^@codesync/config$": "<rootDir>/../../packages/config/src/index.ts",
  },
  extensionsToTreatAsEsm: [".ts"],
};
