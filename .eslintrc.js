module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  env: {
    node: true,
    es6: true,
  },
  plugins: [
    "@typescript-eslint",
    // TODO: add react
    // 'react',
    "prettier",
    "import",
    "autofix",
    "css-import-order",
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    // TODO: adding react we will need to add the next line
    // 'plugin:react/recommended',
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:css-import-order/recommended",
  ],
  rules: {
    "autofix/no-debugger": "error",
    "sort-imports": [
      "error",
      {
        ignoreDeclarationSort: true, // don't want to sort import lines, use eslint-plugin-import instead
        memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
        allowSeparatedGroups: true,
      },
    ],
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          ["sibling", "parent"], // <- Relative imports, the sibling and parent types they can be mingled together
          "index",
          "object",
          "type",
          "unknown",
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
      node: {},
      "babel-module": {},
    },
  },
}
