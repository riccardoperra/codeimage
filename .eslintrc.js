module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["xo", "plugin:solid/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "solid"],
  rules: {},
};
