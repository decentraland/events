module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageProvider: "v8",
  testPathIgnorePatterns: ["/lib/", "<rootDir>/test/"],
  moduleNameMapper: {
    "^@dcl/ui-env$": "<rootDir>/src/__mocks__/@dcl/ui-env.ts",
    "^@dcl/ui-env/(.*)$": "<rootDir>/src/__mocks__/@dcl/ui-env.ts",
  },
  globals: {
    "ts-jest": {
      diagnostics: false,
    },
  },
}
