module.exports = {
  "parser": "babel-eslint",
  "extends": require.resolve("baqend-coding-standard/eslint"),
  "rules": {
    "semi": [2, "never"],
    "no-trailing-spaces": ["error", { "skipBlankLines": true }],
    "arrow-body-style": [1, "as-needed"],
    "react/prefer-stateless-function": "off",
    "react/jsx-filename-extension": "off",
    "react/forbid-prop-types": "off"
  },
  "env": {
    "jest": true
  }
}
